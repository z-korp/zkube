import json
import sys

def get_system_tag(system_name, namespace=None):
    """
    Generate system tag based on namespace.
    """
    base_name = f"{'zkube' if namespace is None else namespace}-{system_name}"
    return base_name

def extract_system_addresses(json_data, namespace=None):
    """
    Extract system addresses and generate deployment command with column format.
    """
    # Systems we want to extract
    target_systems = {
        'minter': get_system_tag('minter', namespace),
        'tournament': get_system_tag('tournament', namespace),
        'chest': get_system_tag('chest', namespace),
        'zkorp': get_system_tag('zkorp', namespace),
        'play': get_system_tag('play', namespace),
        'settings': get_system_tag('settings', namespace),
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

def main(slot, namespace=None):
    """
    Main function to read JSON file and generate command.
    """
    file_path = f"manifest_{slot}.json"
    
    try:
        with open(file_path, 'r') as file:
            json_data = json.load(file)
            addresses, command = extract_system_addresses(json_data, namespace)
            
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
    if len(sys.argv) < 2 or len(sys.argv) > 3:
        print("Usage: python manifest_extractor.py <deployment> [namespace]")
        print("Example: python manifest_extractor.py slotdev")
        print("Example with namespace: python manifest_extractor.py slotdev myspace")
        sys.exit(1)
        
    slot = sys.argv[1]
    namespace = sys.argv[2] if len(sys.argv) == 3 else None
    main(slot, namespace)