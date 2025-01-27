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
            print(f"Attempting to fetch: {url}")
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
            print(f"Current URL: {self.driver.current_url}")
            return None

    def format_result(self, result, tx_note=""):
        """Format the parsing result into a readable string"""
        if not result:
            return f"Error: Could not parse transaction"
            
        output = f"Transaction Analysis\n"
        if tx_note:
            output += f"Note: {tx_note}\n"
        output += f"Hash: {result['tx_hash']}\n"
        output += f"Network: {result['network']}\n\n"
        
        # Gas information
        if result['gas']:
            output += f"Gas Consumed: {result['gas']:,} gas\n\n"
        else:
            output += "Gas Consumed: No data available\n\n"
        
        # Execution resources
        output += "Execution Resources:\n"
        for resource, value in result['execution_resources'].items():
            output += f"  {resource}: {value:,}\n"
            
        return output

    def __del__(self):
        if hasattr(self, 'driver'):
            self.driver.quit()

def main():
    # Network configuration
    network = {
        "name": "sepolia",
        "transactions": [
            {
                "hash": "0x02d0566680e58cbf78fdf8a542109693c4e8cfd3c396a8b4c363ffb67ddb518c",
                "note": "test_into_contract_felt_32"
            },
            {
                "hash": "0x001a413ab47585930edd940c37c43729e3a36236ca9b10759998f88f8ca40bbe",
                "note": "test_into_contract_felt_32"
            }
        ]
    }

    parser = StarknetTxParser()
    
    # Analyze each transaction
    for tx in network["transactions"]:
        print(f"\n=== Transaction Analysis ===")
        result = parser.parse_transaction(tx["hash"], network["name"])
        analysis = parser.format_result(result, tx["note"])
        print(analysis)
        print("="*50)

if __name__ == "__main__":
    main()