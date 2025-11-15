import requests
import json
from collections import Counter

def count_unique_minted_by_addresses():
    # GraphQL endpoint - replace with the actual endpoint URL
    url = "https://api.cartridge.gg/x/zkube-ba-mainnet/torii/graphql"
    
   # Initialize variables for pagination
    has_next_page = True
    cursor = None
    minted_by_addresses = []
    total_processed = 0
    
    print("Fetching data with pagination...")
    
    # Loop until all pages are fetched
    while has_next_page:
        # Construct the query with pagination parameters
        if cursor:
            query = """
            query ZkubeBudoV110TokenMetadataModels {
                zkubeBudoV110TokenMetadataModels(first: 100, after: "%s") {
                    totalCount
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                    edges {
                        cursor
                        node {
                            token_id
                            minted_by
                            player_name
                            settings_id
                        }
                    }
                }
            }
            """ % cursor
        else:
            query = """
            query ZkubeBudoV110TokenMetadataModels {
                zkubeBudoV110TokenMetadataModels(first: 100) {
                    totalCount
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                    edges {
                        cursor
                        node {
                            token_id
                            minted_by
                            player_name
                            settings_id
                        }
                    }
                }
            }
            """
        
        # Headers - adjust as needed for authentication
        headers = {
            "Content-Type": "application/json",
        }
        
        # Make the request
        response = requests.post(
            url,
            json={"query": query},
            headers=headers
        )
        
        # Check if request was successful
        if response.status_code == 200:
            # Parse the response
            data = response.json()
            
            # Extract the data
            result = data.get("data", {}).get("zkubeBudoV110TokenMetadataModels", {})
            edges = result.get("edges", [])
            page_info = result.get("pageInfo", {})
            
            # Get total count if this is the first page
            if cursor is None:
                total_count = result.get("totalCount", 0)
                print(f"Total tokens/NFTs reported by API: {total_count}")
            
            # Process the current page
            batch_size = len(edges)
            total_processed += batch_size
            print(f"Processing batch of {batch_size} records (total processed: {total_processed})")
            
            # Extract minted_by values from this page
            for edge in edges:
                node = edge.get("node", {})
                minted_by = node.get("minted_by")
                if minted_by is not None:  # Only add non-None values
                    minted_by_addresses.append(minted_by)
            
            # Check if there are more pages
            has_next_page = page_info.get("hasNextPage", False)
            
            # Update cursor for next page
            if has_next_page:
                cursor = page_info.get("endCursor")
                print(f"Fetching next page with cursor: {cursor}")
            else:
                print("All pages fetched successfully")
        else:
            print(f"Error: Request failed with status code {response.status_code}")
            print(response.text)
            has_next_page = False
    
    # Count occurrences of each minted_by address
    address_counts = Counter(minted_by_addresses)
    
    # Print summary statistics
    print("\n===== SUMMARY STATISTICS =====")
    print(f"Total tokens/NFTs processed: {total_processed}")
    print(f"Total unique minting addresses: {len(address_counts)}")
    
    # Print counts for each address
    print("\n===== TOP 10 MINTING ADDRESSES =====")
    for address, count in address_counts.most_common(10):
        print(f"Address: {address} - Count: {count} tokens ({count/total_processed*100:.2f}%)")
    
    # Option to export to CSV
    export_to_csv = input("\nWould you like to export the full results to a CSV file? (y/n): ")
    if export_to_csv.lower() == 'y':
        try:
            import csv
            with open('minting_address_counts.csv', 'w', newline='') as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(['Address', 'Count', 'Percentage'])
                for address, count in address_counts.most_common():
                    writer.writerow([address, count, f"{count/total_processed*100:.2f}%"])
            print("Results exported to minting_address_counts.csv")
        except Exception as e:
            print(f"Error exporting to CSV: {e}")
    
    return {
        "unique_addresses": len(address_counts),
        "total_tokens": total_processed,
        "address_counts": address_counts
    }

if __name__ == "__main__":
    count_unique_minted_by_addresses()