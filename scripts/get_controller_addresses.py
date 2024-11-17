import requests
import csv

def fetch_addresses():
    """
    Effectue la requête GraphQL et sauvegarde les adresses dans un CSV
    """
    # L'endpoint correct est /query
    url = "https://api.cartridge.gg/query"
    
    # La requête GraphQL
    query = """
    {
      accounts(first: 10000) {
        totalCount
        edges {
          node {
            controllers {
              edges {
                node {
                  address
                }
              }
            }
          }
        }
      }
    }
    """
    
    # Headers pour la requête
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    # Données de la requête
    payload = {
        'query': query
    }
    
    # Effectuer la requête
    print("Envoi de la requête à l'API...")
    response = requests.post(url, json=payload, headers=headers)
    
    print(f"Status code: {response.status_code}")
    
    if response.status_code == 200:
        try:
            data = response.json()
            
            # Extraire les adresses
            addresses = set()  # Utiliser un set pour éviter les doublons
            for edge in data['data']['accounts']['edges']:
                controllers = edge['node']['controllers']['edges']
                for controller in controllers:
                    address = controller['node']['address']
                    addresses.add(address)
            
            # Convertir le set en liste pour l'écriture CSV
            addresses_list = [[addr] for addr in addresses]
            
            # Sauvegarder dans un CSV
            with open('addresses.csv', 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(['address'])  # En-tête
                writer.writerows(addresses_list)
                
            print(f"Extraction terminée. {len(addresses)} adresses uniques ont été sauvegardées dans addresses.csv")
        except Exception as e:
            print(f"Erreur lors du traitement des données: {e}")
            print(f"Début de la réponse: {response.text[:200]}...")
    else:
        print(f"Erreur lors de la requête: {response.status_code}")
        print(f"Réponse: {response.text[:200]}...")

if __name__ == "__main__":
    fetch_addresses()