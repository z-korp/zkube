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
         "0x2a03b36351ec174b04b09a0e515eeba6d05c1b39170a7258163cb101c93ffb1"),
        # Pair 2
        ("0x6770ab7c447e3186700b54f48fe14694f04d98bb64767fe1346ad8894d072a0",
         "0x630f0a5f5df11be641ef47d32dc16587452ab6ca3b1ac6ad7fd442fb35684da"),
        # Pair 3
        ("0x790a6bdbc9ef48c662cd6ae0d03e69b86fdcf1cddf0fd40e01215cfc06bdbc2",
         "0xc4733f9464cc05c10c985f23e7f9be395fd3d2dfae48b74538be4c0b636aa8"),
        # Pair 4
        ("0x25ab71f2ff51043bb51505de8a33a80ce0a9550fa377bccd31a6a2ac91819c9",
         "0x31dcd330e1d67d7c8d26365977a1b813c152aec1fb43789c3e2d218a466256e"),
        # Pair 5
        ("0x6f591fbfcb033552d770a819c7bbc06d190c6abceefca6d898d443573fa9a89",
         "0x58fa2ccb0beff7ccdfc11a5d4b3c8fb120e90360b76a29fc2402da5ba514a1f"),
        # Pair 6
        ("0x52629012ae68876e668afdc06ecf15cfd680b249ef1de0f4a902be1fe9ca5de",
         "0x67f7abb9b5a83de4e200865fd393741784d075be6fbff487ea84d533dc3e318"),
        # Pair 7
        ("0x156138b3e889babc8e34f0ba892ae17f38f7d5e0951bb9debcfd9b97b2dd446",
         "0x763c181089925c1c071460b9821d0b07cb6a0b27c0bed0c99ce3457260ef8cb"),
        # Pair 8
        ("0x196c1bc76bc1048bc261ccaa2ff1913753e7e8952528f1076755db3c9c0fc53",
         "0x543b93d75e65adb1d4bd801578d0fb6b84ac4ec82b24244028e99de40944d53"),
        # Pair 9
        ("0x559ea0084ea354450c84c39351aa84183aee3ae5dbbcd3b70de63426ecc5af9",
         "0x3a105574498382a2db9efc0549180df6c6700e03c7eb277fb447347d07270ad"),
        # Pair 10
        ("0x686ff5ef2eb24ed0a4ef96b5c18d7e7f3e9e6b3b9e2860dcc0cb8813360301a",
         "0x1380c953829cfd1b3e94c91ac6f83d4022d1a6fa0ebc2f032d407ece979e1af"),
    ]

    parser = StarknetTxParser()
    
    for i, (mainnet_tx, sepolia_tx) in enumerate(tx_pairs, 1):
        print(f"\n=== Pair {i} ===")
        comparison = parser.compare_transactions(mainnet_tx, sepolia_tx)
        print(comparison)
        print("="*50)

if __name__ == "__main__":
    main()