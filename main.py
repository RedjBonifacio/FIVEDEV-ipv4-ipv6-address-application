import requests

# Get the computer's current public IP address
ip_url = "https://api64.ipify.org?format=json"

try:
    ip_response = requests.get(ip_url, timeout=10)
    ip_response.raise_for_status()
    ip = ip_response.json().get("ip")

    # Get information about the public IP address
    info_url = f"https://ipinfo.io/{ip}/json"
    info_response = requests.get(info_url, timeout=10)
    info_response.raise_for_status()
    data = info_response.json()

    # Get information from the API response
    city = data.get("city")
    region = data.get("region")
    country = data.get("country")
    timezone = data.get("timezone")
    organization = data.get("org")

    # Determine the IP version
    if ":" in ip:
        version = "IPv6"
    else:
        version = "IPv4"

    # Display the IP addressing information
    print()
    print("========================================")
    print("      IPv4/IPv6 Address Application")
    print("========================================")
    print(f"IP Address:   {ip}")
    print(f"IP Version:   {version}")
    print(f"City:         {city}")
    print(f"Region:       {region}")
    print(f"Country:      {country}")
    print(f"Timezone:     {timezone}")
    print(f"Provider:     {organization}")
    print("========================================")
    print()

except requests.exceptions.RequestException as error:
    print("Unable to retrieve IP information.")
    print(f"Error: {error}")