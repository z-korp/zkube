import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

class StarknetTxParser:
    def __init__(self):
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        self.driver = webdriver.Chrome(options=chrome_options)

    def parse_transaction(self, tx_hash, network='mainnet'):
        """Parse a single transaction from specified network"""
        base_url = "https://voyager.online" if network == 'mainnet' else "https://sepolia.voyager.online"
        url = f"{base_url}/tx/{tx_hash}"
        
        try:
            self.driver.get(url)
            time.sleep(5)
            
            all_elements = self.driver.find_elements(By.XPATH, "//*[text()]")
            all_text = [elem.text for elem in all_elements]
            
            # Extract execution resources
            resources = {}
            resources_started = False
            current_number = None
            
            for i, text in enumerate(all_text):
                if text == "EXECUTION RESOURCES:":
                    resources_started = True
                    continue
                
                if resources_started:
                    if text.isdigit():
                        current_number = int(text)
                    elif current_number is not None:
                        if text == "STEPS":
                            resources["steps"] = current_number
                        elif text == "PEDERSEN_BUILTIN":
                            resources["pedersen"] = current_number
                        elif text == "RANGE_CHECK_BUILTIN":
                            resources["range_check"] = current_number
                        elif text == "BITWISE_BUILTIN":
                            resources["bitwise"] = current_number
                        elif text == "EC_OP_BUILTIN":
                            resources["ec_op"] = current_number
                        elif text == "POSEIDON_BUILTIN":
                            resources["poseidon"] = current_number
                            resources_started = False
                        current_number = None
            
            # Extract gas consumed
            gas = None
            for i, text in enumerate(all_text):
                if text == "GAS CONSUMED:":
                    if i + 1 < len(all_text):
                        try:
                            gas = int(all_text[i + 1])
                            break
                        except ValueError:
                            continue
            
            return {
                "tx_hash": tx_hash,
                "network": network,
                "execution_resources": resources,
                "gas": gas
            }
            
        except Exception as e:
            print(f"Error parsing transaction {tx_hash} on {network}: {e}")
            return None

    def compare_transactions(self, mainnet_tx, sepolia_tx):
        """Compare two transactions and return formatted comparison"""
        mainnet_result = self.parse_transaction(mainnet_tx, 'mainnet')
        sepolia_result = self.parse_transaction(sepolia_tx, 'sepolia')
        
        if not mainnet_result or not sepolia_result:
            return "Error: Could not parse one or both transactions"
            
        comparison = f"Transaction Comparison:\n"
        comparison += f"Mainnet: {mainnet_tx}\n"
        comparison += f"Sepolia: {sepolia_tx}\n\n"
        
        # Compare gas
        gas_diff = ((sepolia_result['gas'] - mainnet_result['gas']) / mainnet_result['gas'] * 100) if mainnet_result['gas'] else 0
        comparison += f"Gas Comparison:\n"
        comparison += f"Mainnet: {mainnet_result['gas']:,} gas\n"
        comparison += f"Sepolia: {sepolia_result['gas']:,} gas\n"
        comparison += f"Difference: {gas_diff:+.2f}%\n\n"
        
        # Compare execution resources
        comparison += "Execution Resources Comparison:\n"
        all_resources = set(list(mainnet_result['execution_resources'].keys()) + 
                          list(sepolia_result['execution_resources'].keys()))
        
        for resource in all_resources:
            mainnet_value = mainnet_result['execution_resources'].get(resource, 0)
            sepolia_value = sepolia_result['execution_resources'].get(resource, 0)
            diff_percent = ((sepolia_value - mainnet_value) / mainnet_value * 100) if mainnet_value else 0
            
            comparison += f"{resource}:\n"
            comparison += f"  Mainnet: {mainnet_value:,}\n"
            comparison += f"  Sepolia: {sepolia_value:,}\n"
            comparison += f"  Difference: {diff_percent:+.2f}%\n"
            
        return comparison

    def __del__(self):
        if hasattr(self, 'driver'):
            self.driver.quit()

def main():
    # Paired transaction hashes
    tx_pairs = [
        # Pair 1
        ("0x521a1eaedd084344961a8f2221986d5ecdb7a38b5eabccbbeb7684d1747a82f",
         "0x4022ebee340a02c5a0bc070de2fba6d65f723e9284b66f66081e2a4928bc726"),
        # Pair 2
        ("0x6770ab7c447e3186700b54f48fe14694f04d98bb64767fe1346ad8894d072a0",
         "0x7e753ca59a0ca2234d3abf0a516afc6b92ff44051f4ca5d440238746032fbce"),
        # Pair 3
        ("0x790a6bdbc9ef48c662cd6ae0d03e69b86fdcf1cddf0fd40e01215cfc06bdbc2",
         "0x110c82d2a0af32908c41b770a6774e740e19fe12002f3b1abc3a254fccf281d"),
        # Pair 4
        ("0x25ab71f2ff51043bb51505de8a33a80ce0a9550fa377bccd31a6a2ac91819c9",
         "0x6cb550c3d42c39a6a9d429b98e520f00dfc1b4849c84c6ecc976ef0fa08afbe"),
        # Pair 5
        ("0x6f591fbfcb033552d770a819c7bbc06d190c6abceefca6d898d443573fa9a89",
         "0xa2c15f433c59348496f2187b31f564b12e2440fb1d085da91198c5aadd95af"),
    ]

    parser = StarknetTxParser()
    
    for i, (mainnet_tx, sepolia_tx) in enumerate(tx_pairs, 1):
        print(f"\n=== Pair {i} ===")
        comparison = parser.compare_transactions(mainnet_tx, sepolia_tx)
        print(comparison)
        print("="*50)

if __name__ == "__main__":
    main()