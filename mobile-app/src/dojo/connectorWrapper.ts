/**
 * SessionConnector Wrapper for CapacitorJS Native Apps
 * 
 * This wrapper handles the OAuth flow on native apps where:
 * 1. User taps "Connect" -> Browser opens for Cartridge authentication
 * 2. App goes to background (pauses)
 * 3. After auth, browser redirects to zkubegame://open
 * 4. App receives deep link and resumes
 * 5. Connection promise resolves with account
 * 
 * The key challenge is that the app lifecycle interrupts the normal
 * connection flow, so we need to:
 * - Track connection state across pause/resume
 * - Prevent browser from reopening on resume
 * - Close browser when deep link is received
 */

import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import SessionConnector from "@cartridge/connector/session";
import type { WithResolvers } from "../types/promise";
import { createWithResolvers } from "../types/promise";
import { DEEP_LINK_URL, UNIVERSAL_LINK_URL } from "../utils/capacitorUtils";
import { createLogger } from "@/utils/logger";

const log = createLogger("dojo/connector");

interface ConnectionResult {
  account?: string;
  chainId?: bigint;
}

type ListenerHandle = { remove: () => Promise<void> };

class SessionConnectorWrapper extends SessionConnector {
  private static activeInstance: SessionConnectorWrapper | null = null;
  private static listenersInitialized = false;
  private static listenerHandles: ListenerHandle[] = [];

  private connectionPromise: WithResolvers<ConnectionResult> | undefined;

  constructor(options: ConstructorParameters<typeof SessionConnector>[0]) {
    super(options);
    SessionConnectorWrapper.activeInstance = this;
    this.setupAppStateListeners();
  }

  /**
   * Set up listeners for app lifecycle and deep links
   */
  private setupAppStateListeners() {
    if (SessionConnectorWrapper.listenersInitialized) {
      return;
    }
    SessionConnectorWrapper.listenersInitialized = true;

    // Handle app resume (returning from browser OAuth)
    void App.addListener("resume", async () => {
      try {
        const instance = SessionConnectorWrapper.activeInstance;
        if (!instance) return;

        // If we weren't expecting a connection, don't do anything
        if (!instance.connectionPromise) return;

        // The app just resumed from switching windows. This means the user 
        // probably came back from the browser, so we don't want to reopen it.
        instance.controller.reopenBrowser = false;
        
        const account = await instance.connectWithSession();
        instance.connectionPromise?.resolve(account);
      } catch (error) {
        log.error("Error after app resumed", error);
        SessionConnectorWrapper.activeInstance?.connectionPromise?.reject(error);
      }
    }).then((handle) => {
      SessionConnectorWrapper.listenerHandles.push(handle);
    });

    // Handle app pause (going to background)
    void App.addListener("pause", () => {
      // Nothing special needed here, but keeping the listener
      // in case we need to add cleanup logic later
    }).then((handle) => {
      SessionConnectorWrapper.listenerHandles.push(handle);
    });

    // Handle deep link callback (zkubegame://open or https://zkube.xyz/open)
    void App.addListener("appUrlOpen", ({ url }) => {
      if (url.startsWith(DEEP_LINK_URL) || url.startsWith(UNIVERSAL_LINK_URL)) {
        log.info("Deep link received", url);
        try {
          Browser.close();
        } catch (error) {
          // Browser might already be closed, ignore
          log.debug("Browser close attempted", error);
        }
      }
    }).then((handle) => {
      SessionConnectorWrapper.listenerHandles.push(handle);
    });
  }

  static async disposeAppStateListeners() {
    const handles = SessionConnectorWrapper.listenerHandles;
    SessionConnectorWrapper.listenerHandles = [];
    SessionConnectorWrapper.listenersInitialized = false;
    SessionConnectorWrapper.activeInstance = null;

    await Promise.all(
      handles.map(async (handle) => {
        try {
          await handle.remove();
        } catch (error) {
          log.warn("Failed to remove app state listener", error);
        }
      })
    );
  }

  private async connectWithSession(): Promise<ConnectionResult> {
    return super.connect();
  }

  /**
   * Internal connect handler that opens the browser
   */
  private async handleConnect() {
    try {
      // This will throw an error if the browser opens as the GraphQL 
      // subscription will be interrupted. The case where it doesn't 
      // throw an error is if the session is available in local storage.
      this.controller.reopenBrowser = true;
      const account = await this.connectWithSession();
      this.connectionPromise?.resolve(account);
    } catch (error) {
      if ((error as Error).message.includes("Failed to fetch")) {
        // Expected error - app stopped and the GraphQL subscription failed
        // This is normal when browser opens for OAuth
        log.debug("Expected: app stopped during OAuth");
        return;
      }
      // Unexpected error, propagate it
      this.connectionPromise?.reject(error);
    }
  }

  /**
   * Override connect to handle native app OAuth flow
   */
  async connect(): Promise<ConnectionResult> {
    try {
      // If we already have an account, return it immediately
      if (this.controller.account) {
        return {
          account: this.controller.account.address,
          chainId: await this.chainId(),
        };
      }

      // Create a new connection promise if we don't have one or it's been used
      if (!this.connectionPromise) {
        this.connectionPromise = createWithResolvers<ConnectionResult>();
        void this.handleConnect();
      }

      // Wait for the connection to complete (via resume handler or direct return)
      const account = await this.connectionPromise.promise;
      
      // Clear the promise if we got a valid account
      if (this.controller.account) {
        this.connectionPromise = undefined;
      }

      return account;
    } catch (error) {
      this.connectionPromise = undefined;
      throw error;
    }
  }
}

export default SessionConnectorWrapper;
