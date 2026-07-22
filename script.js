let products = [];

const url = "https://script.google.com/macros/s/AKfycbya6DEe15tzth8y931GK-zQaqAzDvw0b3fFCijzK-ihR-q5kBPge4p14hZjw1pr8LlrsA/exec";

const searchInput = document.getElementById("search");
const resultsDiv = document.getElementById("results");

async function loadData() {

    resultsDiv.innerHTML = "<div class='loading'>Loading Products...</div>";

    try {

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Unable to load data");
        }

        products = await response.json();

        resultsDiv.innerHTML = "<div class='loading'>Type to search products...</div>";

    } catch (error) {

        console.log(error);

        resultsDiv.innerHTML = "<div class='no-result'>Unable to connect to Google Sheet.</div>";

    }

}

loadData();

searchInput.addEventListener("input", searchProducts);

// Get field safely
function getField(item, keys) {

    for (const key of keys) {

        if (item[key] !== undefined && item[key] !== null && item[key] !== "") {

            return item[key];

        }

    }

    return "";

}

// Format Currency
function formatCurrency(raw) {

    if (raw === undefined || raw === null || raw === "") {

        return "-";

    }

    const str = String(raw).trim();

    const isUSD = str.includes("$") || str.toUpperCase().includes("USD");

    const num = parseFloat(str.replace(/[^0-9.]/g, ""));

    if (isNaN(num)) {

        return str;

    }

    if (isUSD) {

        return "$" + num.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

    }

    return "₹" + num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

}

const DEFAULT_GST_RATE = 18;

// Calculate GST Price (for the FULL quantity, matching "Amount")
function getGstPrice(item) {

    const directGstPrice = getField(item, [
        "GST PRICE",
        "GST_PRICE",
        "GSTPRICE",
        "PRICE WITH GST",
        "PRICE INCL GST",
        "TOTAL",
        "TOTAL AMOUNT"
    ]);

    if (directGstPrice !== "") {

        return directGstPrice;

    }

    // Prefer AMOUNT (price x quantity) as the base; fall back to PRICE x QUANTITY
    let baseRaw = getField(item, ["AMOUNT"]);
    let baseStr;

    if (baseRaw !== "") {

        baseStr = String(baseRaw).trim();

    } else {

        const priceRaw = getField(item, ["PRICE"]);

        if (priceRaw === "") {

            return "";

        }

        const priceStr = String(priceRaw).trim();
        const price = parseFloat(priceStr.replace(/[^0-9.]/g, ""));

        if (isNaN(price)) {

            return "";

        }

        const qtyRaw = getField(item, ["QUANTITY"]);
        const qty = parseFloat(String(qtyRaw).replace(/[^0-9.]/g, "")) || 1;

        baseStr = String(price * qty) + (priceStr.includes("$") || priceStr.toUpperCase().includes("USD") ? " USD" : "");

    }

    const isUSD = baseStr.includes("$") || baseStr.toUpperCase().includes("USD");

    const base = parseFloat(baseStr.replace(/[^0-9.]/g, ""));

    if (isNaN(base)) {

        return "";

    }

    let gst = parseFloat(String(getField(item, ["GST"])).replace(/[^0-9.]/g, ""));

    if (isNaN(gst)) {

        gst = DEFAULT_GST_RATE;

    }

    // Convert 0.18 to 18
    if (gst > 0 && gst < 1) {

        gst = gst * 100;

    }

    const total = base * (1 + gst / 100);

    return isUSD ? "$" + total : "₹" + total;

}

function searchProducts() {

    const query = searchInput.value.trim().toLowerCase();

    if (query === "") {

        resultsDiv.innerHTML = "";

        return;

    }

    const filtered = products.filter(item => {

        return [

            getField(item, ["ITEM"]),
            getField(item, ["CUSTOMER"]),
            getField(item, ["ENGINE"]),
            getField(item, ["PRICE"]),
            getField(item, ["QUANTITY"]),
            getField(item, ["OUR NUMBER", "OUR_NUMBER", "OURNUMBER"])

        ].some(value =>

            String(value || "").toLowerCase().includes(query)

        );

    });

    displayResults(filtered);

}

function displayResults(list) {

    if (list.length === 0) {

        resultsDiv.innerHTML = "<div class='no-result'>No Products Found</div>";

        return;

    }

    resultsDiv.innerHTML = list.map(item => {

        const itemName = getField(item, ["ITEM"]) || "-";
        const customer = getField(item, ["CUSTOMER"]) || "-";
        const engine = getField(item, ["ENGINE"]) || "-";
        const quantity = getField(item, ["QUANTITY"]);
        const unit = getField(item, ["UNIT"]);
        const price = getField(item, ["PRICE"]);
        const amount = getField(item, ["AMOUNT"]);
        const gst = getField(item, ["GST"]);
        const gstPrice = getGstPrice(item);
        const ourNumber = getField(item, ["OUR NUMBER", "OUR_NUMBER", "OURNUMBER"]);

        const qtyDisplay = quantity ? `${quantity}${unit ? " " + unit : ""}` : "-";

        let gstDisplay = "";

        if (gst !== "") {

            let gstValue = parseFloat(gst);

            if (!isNaN(gstValue)) {

                if (gstValue > 0 && gstValue < 1) {

                    gstValue = gstValue * 100;

                }

                gstDisplay = gstValue + "%";

            } else {

                gstDisplay = gst;

            }

        }

        return `

        <div class="card">

            <h3>${itemName}</h3>

            <div class="row"><span class="label">Customer:</span> ${customer}</div>

            <div class="row"><span class="label">Engine:</span> ${engine}</div>

            <div class="row"><span class="label">Quantity:</span> ${qtyDisplay}</div>

            <div class="row"><span class="label">Price:</span> ${formatCurrency(price)}</div>

            <div class="row"><span class="label">Amount:</span> ${formatCurrency(amount)}</div>

            ${gstDisplay ? `<div class="row"><span class="label">GST:</span> ${gstDisplay}</div>` : ""}

            ${gstPrice ? `<div class="row"><span class="label">Amount (Incl. GST):</span> ${formatCurrency(gstPrice)}</div>` : ""}

            ${ourNumber ? `<div class="row"><span class="label">Our No.:</span> ${ourNumber}</div>` : ""}

        </div>

        `;

    }).join("");

}
