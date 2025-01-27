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
            
            print(f"Page title: {self.driver.title}")
            
            all_elements = self.driver.find_elements(By.XPATH, "//*[text()]")
            all_text = [elem.text for elem in all_elements]
            
            print(f"Found {len(all_text)} text elements")
            
            # Extract execution resources
            resources = {}
            resources_started = False
            current_number = None
            
            for i, text in enumerate(all_text):
                if text == "EXECUTION RESOURCES:":
                    resources_started = True
                    print("Found execution resources section")
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
                            print(f"Found gas: {gas}")
                            break
                        except ValueError:
                            continue
            
            result = {
                "tx_hash": tx_hash,
                "network": network,
                "execution_resources": resources,
                "gas": gas
            }
            print(f"Parsed result: {result}")
            return result
            
        except Exception as e:
            print(f"Error parsing transaction {tx_hash} on {network}: {e}")
            print(f"Current URL: {self.driver.current_url}")
            return None

    def compare_transactions(self, tx1_hash, tx2_hash, network1_info, network2_info):
        """Compare two transactions and return formatted comparison"""
        print(f"\nParsing {network1_info['name']} transaction: {tx1_hash}")
        network1_result = self.parse_transaction(tx1_hash, 'sepoliadev1')
        
        print(f"\nParsing {network2_info['name']} transaction: {tx2_hash}")
        network2_result = self.parse_transaction(tx2_hash, 'sepoliadev2')
        
        if not network1_result:
            return f"Error: Could not parse {network1_info['name']} transaction {tx1_hash}"
        if not network2_result:
            return f"Error: Could not parse {network2_info['name']} transaction {tx2_hash}"
            
        comparison = f"Transaction Comparison\n"
        comparison += f"Context: {network1_info['note']} vs {network2_info['note']}\n"
        comparison += f"{network1_info['name']}: {tx1_hash}\n"
        comparison += f"{network2_info['name']}: {tx2_hash}\n\n"
        
        # Compare gas
        if network1_result['gas'] and network2_result['gas']:
            gas_diff = ((network2_result['gas'] - network1_result['gas']) / network1_result['gas'] * 100)
            comparison += f"Gas Comparison:\n"
            comparison += f"{network1_info['name']}: {network1_result['gas']:,} gas\n"
            comparison += f"{network2_info['name']}: {network2_result['gas']:,} gas\n"
            comparison += f"Difference: {gas_diff:+.2f}%\n\n"
        else:
            comparison += "Gas Comparison: Could not compare gas (missing data)\n\n"
        
        # Compare execution resources
        comparison += "Execution Resources Comparison:\n"
        all_resources = set(list(network1_result['execution_resources'].keys()) + 
                          list(network2_result['execution_resources'].keys()))
        
        for resource in all_resources:
            network1_value = network1_result['execution_resources'].get(resource, 0)
            network2_value = network2_result['execution_resources'].get(resource, 0)
            if network1_value:
                diff_percent = ((network2_value - network1_value) / network1_value * 100)
                comparison += f"{resource}:\n"
                comparison += f"  {network1_info['name']}: {network1_value:,}\n"
                comparison += f"  {network2_info['name']}: {network2_value:,}\n"
                comparison += f"  Difference: {diff_percent:+.2f}%\n"
            else:
                comparison += f"{resource}:\n"
                comparison += f"  {network1_info['name']}: {network1_value:,}\n"
                comparison += f"  {network2_info['name']}: {network2_value:,}\n"
                comparison += f"  Difference: N/A (no {network1_info['name']} value)\n"
            
        return comparison

    def __del__(self):
        if hasattr(self, 'driver'):
            self.driver.quit()

def main():
    # Network configurations
    network1 = {
        "name": "sepoliadev1",
        "note": "Old storage",
        "transactions": [
            "0x60294cfc344ca447e2da9e8b50d14604b3b3f82417be68390028e889f65d9cb",
            "0x40b8763c4105c81130f8db280e3d1ae6c71a35b802cd07bf0d14797cbca3b17"
        ]
    }
    
    network2 = {
        "name": "sepoliadev2",
        "note": "New storage",
        "transactions": [
            "0x4a0e4fbdb8e50c84f603280c0b2114fde5947203938c1132f5145e5504b8f9a",
            "0x46e5809030e9e0c6b4942b13e8542a49421116df58b2eca557fdf1dd4575f0a"
        ]
    }

    parser = StarknetTxParser()
    
    # Compare corresponding transactions
    for i, (tx1, tx2) in enumerate(zip(network1["transactions"], network2["transactions"]), 1):
        print(f"\n=== Comparison {i} ===")
        comparison = parser.compare_transactions(tx1, tx2, network1, network2)
        print(comparison)
        print("="*50)

if __name__ == "__main__":
    main()