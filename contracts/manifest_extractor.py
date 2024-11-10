import json
import sys

def extract_system_addresses(json_data):
    """
    Extract system addresses and generate deployment command with column format.
    """
    # Systems we want to extract
    target_systems = {
        'minter': 'zkube-minter',
        'tournament': 'zkube-tournament',
        'chest': 'zkube-chest',
        'zkorp': 'zkube-zkorp',
        'play': 'zkube-play',
        'settings': 'zkube-settings',
    }
    
    # Initialize results dictionary
    addresses = {}
    
    # Extract addresses from contracts
    for contract in json_data['contracts']:
        tag = contract.get('tag', '')
        for system_name, system_tag in target_systems.items():
            if tag == system_tag:
                addresses[system_name] = contract['address']
                break
    
    # Generate deployment command with line breaks
    command = (
        f"starkli deploy \\\n"
        f"    --salt 0x1 \\\n"
        f"    <class_hash> \\\n"
        f"    <default_admin> \\\n"
        f"    <pauser> \\\n"
        f"    <erc20_token> \\\n"
        f"    {addresses['tournament']} \\\n"
        f"    {addresses['chest']} \\\n"
        f"    {addresses['zkorp']} \\\n"
        f"    {addresses['play']} \\\n"
        f"    {addresses['minter']}"
    )
    
    return addresses, command

def main(slot):
    """
    Main function to read JSON file and generate command.
    """
    file_path = f"manifest_{slot}.json"
    
    try:
        with open(file_path, 'r') as file:
            json_data = json.load(file)
            addresses, command = extract_system_addresses(json_data)
            
            # Print system addresses for reference
            print("\nSystem Addresses:")
            print("-----------------")
            for system, address in addresses.items():
                print(f"{system.capitalize():10} : {address}")
            
            # Print the generated command
            print("\nDeployment Command:")
            print("-----------------")
            print(command)
            
            return addresses
            
    except FileNotFoundError:
        print(f"Error: File {file_path} not found")
        return None
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in {file_path}")
        return None
    except Exception as e:
        print(f"Error: An unexpected error occurred: {str(e)}")
        return None
    

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python manifest_extractor.py <deployment>")
        print("Example: python manifest_extractor.py slotdev")
        sys.exit(1)
        
    slot = sys.argv[1]
    main(slot)