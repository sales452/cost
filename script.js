let products = [];

const url = "https://script.google.com/macros/s/AKfycbya6DEe15tzth8y931GK-zQaqAzDvw0b3fFCijzK-ihR-q5kBPge4p14hZjw1pr8LlrsA/exec";

const searchInput = document.getElementById("search");
const resultsDiv = document.getElementById("results");

async function loadData() {

    resultsDiv.innerHTML = "<div class='loading'>Loading products...</div>";

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

// Format currency
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

    return "\u20b9" + num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

}

function numericValue(formatted) {

    if (!formatted || formatted === "-") {

        return 0;

    }

    const n = parseFloat(String(formatted).replace(/[^0-9.]/g, ""));

    return isNaN(n) ? 0 : n;

}

const DEFAULT_GST_RATE = 18;

// Calculate GST price (for the full quantity, matching "Amount")
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

    return isUSD ? "$" + total : "\u20b9" + total;

}

function searchProducts() {

    const query = searchInput.value.trim().toLowerCase();

    if (query === "") {

        resultsDiv.innerHTML = "<div class='loading'>Type to search products...</div>";

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

        resultsDiv.innerHTML = "<div class='no-result'>No products found.</div>";

        return;

    }

    let totalAmount = 0;
    let totalFinal = 0;

    const rowsHtml = list.map(item => {

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

        totalAmount += numericValue(formatCurrency(amount));
        totalFinal += numericValue(formatCurrency(gstPrice));

        return `
        <tr>
            <td data-label="Item" class="tt-item">${itemName}</td>
            <td data-label="Customer">${customer}</td>
            <td data-label="Engine">${engine}</td>
            <td data-label="Quantity" class="tt-num">${qtyDisplay}</td>
            <td data-label="Price" class="tt-num">${formatCurrency(price)}</td>
            <td data-label="Amount" class="tt-num">${formatCurrency(amount)}</td>
            <td data-label="GST" class="tt-center">${gstDisplay ? `<span class="tt-badge">${gstDisplay}</span>` : "-"}</td>
            <td data-label="Incl. GST" class="tt-num tt-final">${gstPrice ? formatCurrency(gstPrice) : "-"}</td>
            <td data-label="Our No.">${ourNumber || "-"}</td>
        </tr>
        `;

    }).join("");

    resultsDiv.innerHTML = `
        <div class="tt-stats">
            <div class="tt-stat"><p>Results</p><p>${list.length}</p></div>
            <div class="tt-stat"><p>Total amount</p><p>\u20b9${Math.round(totalAmount).toLocaleString("en-IN")}</p></div>
            <div class="tt-stat"><p>Total incl. GST</p><p>\u20b9${Math.round(totalFinal).toLocaleString("en-IN")}</p></div>
        </div>
        <div class="tt-table-wrap">
            <table class="tt-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Customer</th>
                        <th>Engine</th>
                        <th class="tt-num">Qty</th>
                        <th class="tt-num">Price</th>
                        <th class="tt-num">Amount</th>
                        <th class="tt-center">GST</th>
                        <th class="tt-num">Incl. GST</th>
                        <th>Our No.</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </div>
    `;

}
