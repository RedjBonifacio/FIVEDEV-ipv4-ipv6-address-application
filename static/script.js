const historyKey = "fivedev-ip-history";
const historyLimit = 6;

// -------------------------
// DOM ELEMENTS
// -------------------------

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const myIpButton = document.getElementById("myIpButton");
const themeButton = document.getElementById("themeButton");

const ipv4Value = document.getElementById("ipv4Value");
const ipv6Value = document.getElementById("ipv6Value");

const ipAddress = document.getElementById("ipAddress");
const ipVersion = document.getElementById("ipVersion");
const ipTypeBadge = document.getElementById("ipTypeBadge");
const city = document.getElementById("city");
const region = document.getElementById("region");
const country = document.getElementById("country");
const timezone = document.getElementById("timezone");
const provider = document.getElementById("provider");

const mapContainer = document.getElementById("mapContainer");
const mapFrame = document.getElementById("mapFrame");

const historyList = document.getElementById("historyList");

const loading = document.getElementById("loading");
const toast = document.getElementById("toast");


// -------------------------
// INITIALIZATION
// -------------------------

document.addEventListener("DOMContentLoaded", () => {
    loadTheme();
    displayHistory();
    getMyIp();
});


// -------------------------
// GET CURRENT IP
// -------------------------

async function getMyIp() {
    showLoading(true);

    try {
        const response = await fetch("/api/my-ip");

        if (!response.ok) {
            throw new Error("Unable to contact the server.");
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || "Unable to retrieve IP information.");
        }

        // Get the actual IP information
        const data = result.data;

        displayIpData(result.data);

        if (data.ipv4 && data.ipv4 !== "Not available") {
            saveHistory(data.ipv4);
        }

        showToast("Public IP information loaded.");

    } catch (error) {
        console.error(error);
        showToast("Unable to retrieve IP information.");
    } finally {
        showLoading(false);
    }
}


// -------------------------
// SEARCH IP
// -------------------------

async function searchIp() {
    const value = searchInput.value.trim();

    if (!value) {
        showToast("Enter an IPv4 or IPv6 address.");
        return;
    }

    if (!isValidIp(value)) {
        showToast("Invalid IP address.");
        return;
    }

    showLoading(true);

    try {
        const response = await fetch(
            `/api/lookup/${encodeURIComponent(value)}`
        );

        if (!response.ok) {
            throw new Error("Lookup failed.");
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || "Lookup failed.");
        }

        // Get the actual IP information
        const data = result.data;

        displayIpData(data);
        saveHistory(value);

        showToast("IP information found.");

    } catch (error) {
        console.error(error);
        showToast("Unable to find information for this IP.");
    } finally {
        showLoading(false);
    }
}


// -------------------------
// DISPLAY DATA
// -------------------------

function displayIpData(data) {

    const address = data.ip || data.address || "Not available";

    ipAddress.textContent = address;

    ipVersion.textContent =
        data.version ||
        (address.includes(":") ? "IPv6" : "IPv4");

    city.textContent = data.city || "Not available";
    region.textContent = data.region || "Not available";
    country.textContent = data.country || "Not available";
    timezone.textContent = data.timezone || "Not available";
    provider.textContent =
        data.provider ||
        data.organization ||
        "Not available";

    // IP type badge (Public / Private / Reserved / etc.)
    if (ipTypeBadge && data.ip_type) {
        ipTypeBadge.textContent = data.ip_type.toUpperCase();
        ipTypeBadge.className = "badge badge-" + data.ip_type.toLowerCase();
    }

    if (data.ipv4 !== undefined) {
        ipv4Value.textContent =
            data.ipv4 || "Not available";
    }

    if (data.ipv6 !== undefined) {
        const ipv6Text = data.ipv6 || "Not available";
        ipv6Value.textContent = ipv6Text;

        // Detect if this is a real IPv6 address vs a status message
        const looksLikeIp = ipv6Text.includes(":") && !ipv6Text.includes(" ");

        ipv6Value.classList.toggle("long-text", !looksLikeIp);
    }

    // Map preview
    if (mapFrame && mapContainer && data.coordinates && data.coordinates !== "Unavailable") {
        const [lat, lon] = data.coordinates.split(",");
        const delta = 0.15;

        const bbox = [
            parseFloat(lon) - delta,
            parseFloat(lat) - delta,
            parseFloat(lon) + delta,
            parseFloat(lat) + delta
        ].join(",");

        mapFrame.src =
            `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&marker=${lat},${lon}`;

        mapContainer.style.display = "block";
    } else if (mapContainer) {
        mapContainer.style.display = "none";
    }
}


// -------------------------
// IP VALIDATION
// -------------------------

function isValidIp(ip) {

    // IPv4
    const ipv4 =
        /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

    // Basic IPv6 validation
    const ipv6 =
        /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(([0-9a-fA-F]{1,4}:){1,7}:)|(([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})|(([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2})|(([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3})|(([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4})|(([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5})|([0-9a-fA-F]{1,4}:)((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;

    return ipv4.test(ip) || ipv6.test(ip);
}


// -------------------------
// HISTORY
// -------------------------

function saveHistory(ip) {

    let history = getHistory();

    history = history.filter(item => item !== ip);

    history.unshift(ip);

    history = history.slice(0, historyLimit);

    localStorage.setItem(
        historyKey,
        JSON.stringify(history)
    );

    displayHistory();
}


function getHistory() {

    try {
        return JSON.parse(
            localStorage.getItem(historyKey)
        ) || [];
    } catch {
        return [];
    }
}


function displayHistory() {

    const history = getHistory();

    if (!historyList) {
        return;
    }

    historyList.innerHTML = "";

    if (history.length === 0) {

        const empty = document.createElement("div");

        empty.className = "empty-history";
        empty.textContent = "No previous IP searches.";

        historyList.appendChild(empty);

        return;
    }

    history.forEach(ip => {

        const item = document.createElement("div");

        item.className = "history-item";

        const address = document.createElement("span");

        address.textContent = ip;

        const button = document.createElement("button");

        button.textContent = "VIEW";

        button.addEventListener("click", () => {

            searchInput.value = ip;

            searchIp();

        });

        item.appendChild(address);
        item.appendChild(button);

        historyList.appendChild(item);
    });
}


// -------------------------
// COPY IP
// -------------------------

async function copyAddress(type) {

    let value;

    if (type === "ipv4") {
        value = ipv4Value.textContent;
    } else {
        value = ipv6Value.textContent;
    }

    if (!value || value === "Not available") {
        showToast("No IP address available.");
        return;
    }

    try {

        await navigator.clipboard.writeText(value);

        showToast(`${type.toUpperCase()} copied.`);

    } catch {

        showToast("Unable to copy address.");

    }
}


// -------------------------
// THEME
// -------------------------

function toggleTheme() {

    document.body.classList.toggle("light");

    const isLight =
        document.body.classList.contains("light");

    localStorage.setItem(
        "fivedev-theme",
        isLight ? "light" : "dark"
    );

    updateThemeIcon();
}


function loadTheme() {

    const saved =
        localStorage.getItem("fivedev-theme");

    if (saved === "light") {
        document.body.classList.add("light");
    }

    updateThemeIcon();
}


function updateThemeIcon() {

    if (!themeButton) {
        return;
    }

    const isLight =
        document.body.classList.contains("light");

    themeButton.textContent =
        isLight ? "☀" : "☾";
}


// -------------------------
// LOADING
// -------------------------

function showLoading(state) {

    if (!loading) {
        return;
    }

    if (state) {
        loading.classList.add("active");
    } else {
        loading.classList.remove("active");
    }
}


// -------------------------
// TOAST
// -------------------------

let toastTimer;

function showToast(message) {

    if (!toast) {
        return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


// -------------------------
// EVENT LISTENERS
// -------------------------

if (searchButton) {
    searchButton.addEventListener(
        "click",
        searchIp
    );
}

if (myIpButton) {
    myIpButton.addEventListener(
        "click",
        getMyIp
    );
}

if (themeButton) {
    themeButton.addEventListener(
        "click",
        toggleTheme
    );
}

if (searchInput) {

    searchInput.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {
                searchIp();
            }

        }
    );
}