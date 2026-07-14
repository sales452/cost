let products = [];

const url = "https://script.google.com/macros/s/AKfycbya6DEe15tzth8y931GK-zQaqAzDvw0b3fFCijzK-ihR-q5kBPge4p14hZjw1pr8LlrsA/exec";

const searchInput = document.getElementById("search");
const resultsDiv = document.getElementById("results");

async function loadData() {
    try {
        resultsDiv.innerHTML = "<p>Loading products...</p>";

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Unable to fetch data");
        }

        products = await response.json();

        resultsDiv.innerHTML = `<p>${products.length} Products Loaded</p>`;

    } catch (err) {
        console.error(err);
        resultsDiv.innerHTML = "<p style='color:red'>Failed to load data.</p>";
    }
}

loadData();

searchInput.addEventListener("input", searchProducts);

function searchProducts() {

    const query = searchInput.value.trim().toLowerCase();

    if (query === "") {
        resultsDiv.innerHTML = "";
        return;
    }

    const filtered = products.filter(item => {

        return [
            item.ITEM,
            item.CUSTOMER,
            item.ENGINE,
            item.PRICE,
            item.QUANTITY
        ].some(value =>
            String(value || "").toLowerCase().includes(query)
        );

    });

    displayResults(filtered);
}

function displayResults(list) {

    if (list.length === 0) {
        resultsDiv.innerHTML = "<p>No products found.</p>";
        return;
    }

    resultsDiv.innerHTML = list.map(item => `
        <div class="card">
            <h3>${item.ITEM || "-"}</h3>
            <p><strong>Customer:</strong> ${item.CUSTOMER || "-"}</p>
            <p><strong>Engine:</strong> ${item.ENGINE || "-"}</p>
            <p><strong>Price:</strong> $${item.PRICE || "-"}</p>
            <p><strong>Quantity:</strong> ${item.QUANTITY || "-"}</p>
        </div>
    `).join("");
}
