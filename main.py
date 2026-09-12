from flask import Flask, jsonify, render_template
import requests
import ipaddress

app = Flask(__name__)


def get_public_ip(version="ipv4"):
    """Retrieve the computer's current public IPv4 or IPv6 address."""

    if version == "ipv4":
        url = "https://api.ipify.org?format=json"
    else:
        url = "https://api6.ipify.org?format=json"

    response = requests.get(url, timeout=10)
    response.raise_for_status()

    data = response.json()
    ip = data.get("ip")

    if not ip:
        raise ValueError(f"Public {version.upper()} address was not found.")

    return ip


def get_ip_information(ip):
    """Retrieve additional information about an IP address."""

    url = f"https://ipinfo.io/{ip}/json"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        data = response.json()

        return {
            "ip": ip,
            "version": "IPv6" if ":" in ip else "IPv4",
            "city": data.get("city", "Unavailable"),
            "region": data.get("region", "Unavailable"),
            "country": data.get("country", "Unavailable"),
            "timezone": data.get("timezone", "Unavailable"),
            "organization": data.get("org", "Unavailable"),
            "hostname": data.get("hostname", "Unavailable"),
            "postal": data.get("postal", "Unavailable"),
            "coordinates": data.get("loc", "Unavailable")
        }

    except requests.exceptions.RequestException:
        # IP address was detected,
        # but additional information was unavailable.
        return {
            "ip": ip,
            "version": "IPv6" if ":" in ip else "IPv4",
            "city": "Unavailable",
            "region": "Unavailable",
            "country": "Unavailable",
            "timezone": "Unavailable",
            "organization": "Unavailable",
            "hostname": "Unavailable",
            "postal": "Unavailable",
            "coordinates": "Unavailable"
        }


@app.route("/")
def index():
    """Display the main GUI."""
    return render_template("index.html")


@app.route("/api/my-ip")
def my_ip():
    """Retrieve the computer's current public IPv4 and IPv6 addresses."""

    ipv4 = None
    ipv6 = None

    # Get IPv4
    try:
        ipv4 = get_public_ip("ipv4")
    except requests.exceptions.RequestException:
        pass
    except ValueError:
        pass

    # Get IPv6
    try:
        ipv6 = get_public_ip("ipv6")
    except requests.exceptions.RequestException:
        pass
    except ValueError:
        pass

    # At least one address must be available
    if not ipv4 and not ipv6:
        return jsonify({
            "success": False,
            "error": "Unable to retrieve public IP address."
        }), 500

    # Use IPv4 as the primary IP when available
    primary_ip = ipv4 if ipv4 else ipv6

    information = get_ip_information(primary_ip)

    information["ipv4"] = ipv4 if ipv4 else "Not available"
    information["ipv6"] = ipv6 if ipv6 else "Not available"

    return jsonify({
        "success": True,
        "data": information
    })


@app.route("/api/lookup/<ip>")
def lookup_ip(ip):
    """Search for information about a specific IPv4 or IPv6 address."""

    try:
        # Validate the IP address
        ipaddress.ip_address(ip)

    except ValueError:
        return jsonify({
            "success": False,
            "error": "Invalid IPv4 or IPv6 address."
        }), 400

    information = get_ip_information(ip)

    # Add separate IPv4/IPv6 value for the GUI
    if ":" in ip:
        information["ipv4"] = "Not available"
        information["ipv6"] = ip
    else:
        information["ipv4"] = ip
        information["ipv6"] = "Not available"

    return jsonify({
        "success": True,
        "data": information
    })


if __name__ == "__main__":
    app.run(debug=True)