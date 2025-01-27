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

    def parse_transactions(self, tx_hashes):
        """Parse multiple transactions and return formatted results"""
        results = []
        
        for tx_hash in tx_hashes:
            result = self.parse_transaction(tx_hash)
            if result:
                formatted = self.format_result(result)
                results.append(formatted)
        
        return results

    def parse_transaction(self, tx_hash):
        """Parse a single transaction"""
        url = f"https://sepolia.voyager.online/tx/{tx_hash}"
        
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
                "execution_resources": resources,
                "gas": gas
            }
            
        except Exception as e:
            print(f"Error parsing transaction {tx_hash}: {e}")
            return None

    def format_result(self, result):
        """Format a single transaction result in the requested style"""
        resources = result['execution_resources']
        resource_str = (
            f"{resources.get('steps', 0)} STEPS, "
            f"{resources.get('pedersen', 0)} PEDERSEN_BUILTIN, "
            f"{resources.get('range_check', 0)} RANGE_CHECK_BUILTIN, "
            f"{resources.get('bitwise', 0)} BITWISE_BUILTIN, "
            f"{resources.get('ec_op', 0)} EC_OP_BUILTIN, "
            f"{resources.get('poseidon', 0)} POSEIDON_BUILTIN"
        )
        return f"{result['tx_hash']} -> {result['gas']} GAS, {resource_str}"
        
    def __del__(self):
        if hasattr(self, 'driver'):
            self.driver.quit()

def main():
    # Array of transaction hashes to process
    tx_hashes = [
        "0x74a5d5339df4f731e8430fbfd9d012259a2803bce39b1ecccf2126477bf47a0",
        "0x3f70adc4f6c4bd5c668ca826a9a515b94b4e92e5b99acba88d223e824249f2f",
        "0x5227aa3b7ab8d4a45694a20b80444fb5e9414727292f0745cae71bfb89a6b8a",

        "0x4450436dc7d2e8a1d4d600a1506a955a7170a18fd75edfcf9852d0d7e8c0740",
        "0x2917c8b086fbb49fe25d81c9bf0401d68159cec5726f98ea60d1c1f8a5cd34e",

        "0x7a261302ddd0d8a1a02580e7ac4e6f4d9270cd12a0fe4b55fd1ac45afe361f7",
        "0x5d0a2aa6d9fc9f82930807ec4ed908ad0c17502e34e7b1c486f2954811fdc89",
        "0x75a94b86b78db70b2f26b034f12fc5c40aadeacc2863f8ad63561e31e35fc4a",
        "0x5d23b9728a8850b695a9aa127566fb04ea6bd553d32b99cef303981f0b4c69a",
        "0x414d5ffce8fa525b3d66426b6519d268b548327e1482e13c1d3a46f14a6461d",

        "0xb576bd4ba17e79a5b83b1a3bdcdac922e2804282bbfbc00cbb236da0935fc5",
        "0x115b73e3aafd05fd77115acae80112bce0352b1c55ce8b8b889978a334937",
        "0x3de76c682b574dd35f0d63753628d64dc2debe8b8fd53ac7b923a30b6b2ee24"
    ]
    
    parser = StarknetTxParser()
    results = parser.parse_transactions(tx_hashes)
    
    # Print results
    for result in results:
        print(result)
        print()  # Empty line between transactions

if __name__ == "__main__":
    main()

# mainnet
# 0x521a1eaedd084344961a8f2221986d5ecdb7a38b5eabccbbeb7684d1747a82f
# 0x6770ab7c447e3186700b54f48fe14694f04d98bb64767fe1346ad8894d072a0
# 0x790a6bdbc9ef48c662cd6ae0d03e69b86fdcf1cddf0fd40e01215cfc06bdbc2
# 0x25ab71f2ff51043bb51505de8a33a80ce0a9550fa377bccd31a6a2ac91819c9
# 0x6f591fbfcb033552d770a819c7bbc06d190c6abceefca6d898d443573fa9a89
# 0x52629012ae68876e668afdc06ecf15cfd680b249ef1de0f4a902be1fe9ca5de
# 0x156138b3e889babc8e34f0ba892ae17f38f7d5e0951bb9debcfd9b97b2dd446
# 0x196c1bc76bc1048bc261ccaa2ff1913753e7e8952528f1076755db3c9c0fc53
# 0x559ea0084ea354450c84c39351aa84183aee3ae5dbbcd3b70de63426ecc5af9
# 0x686ff5ef2eb24ed0a4ef96b5c18d7e7f3e9e6b3b9e2860dcc0cb8813360301a

# sepolia
# 0x2a03b36351ec174b04b09a0e515eeba6d05c1b39170a7258163cb101c93ffb1
# 0x630f0a5f5df11be641ef47d32dc16587452ab6ca3b1ac6ad7fd442fb35684da
# 0xc4733f9464cc05c10c985f23e7f9be395fd3d2dfae48b74538be4c0b636aa8
# 0x31dcd330e1d67d7c8d26365977a1b813c152aec1fb43789c3e2d218a466256e
# 0x58fa2ccb0beff7ccdfc11a5d4b3c8fb120e90360b76a29fc2402da5ba514a1f
# 0x67f7abb9b5a83de4e200865fd393741784d075be6fbff487ea84d533dc3e318
# 0x763c181089925c1c071460b9821d0b07cb6a0b27c0bed0c99ce3457260ef8cb
# 0x543b93d75e65adb1d4bd801578d0fb6b84ac4ec82b24244028e99de40944d53
# 0x3a105574498382a2db9efc0549180df6c6700e03c7eb277fb447347d07270ad
# 0x1380c953829cfd1b3e94c91ac6f83d4022d1a6fa0ebc2f032d407ece979e1af

# sepolia 2
# 0x4022ebee340a02c5a0bc070de2fba6d65f723e9284b66f66081e2a4928bc726
# 0x7e753ca59a0ca2234d3abf0a516afc6b92ff44051f4ca5d440238746032fbce
# 0x218e8d75c0698a4c87b59a604c40357f23d738b67332e202cc324e3f7e5f2bc
# 0x110c82d2a0af32908c41b770a6774e740e19fe12002f3b1abc3a254fccf281d
# 0x6cb550c3d42c39a6a9d429b98e520f00dfc1b4849c84c6ecc976ef0fa08afbe
# 0xa2c15f433c59348496f2187b31f564b12e2440fb1d085da91198c5aadd95af




# sepoliadev1 
0x60294cfc344ca447e2da9e8b50d14604b3b3f82417be68390028e889f65d9cb
0x40b8763c4105c81130f8db280e3d1ae6c71a35b802cd07bf0d14797cbca3b17

# sepoliadev2
0x46e5809030e9e0c6b4942b13e8542a49421116df58b2eca557fdf1dd4575f0a
0x4a0e4fbdb8e50c84f603280c0b2114fde5947203938c1132f5145e5504b8f9a
