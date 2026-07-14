let products = [];

async function loadData() {
  const url = "YOUR_GOOGLE_SCRIPT_URL";   // https://script.google.com/macros/s/AKfycbya6DEe15tzth8y931GK-zQaqAzDvw0b3fFCijzK-ihR-q5kBPge4p14hZjw1pr8LlrsA/exec
  const response = await fetch(url);
  products = await response.json();
}

loadData();

const searchInput = document.getElementById("search");
const resultsDiv = document.getElementById("results");

searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();

  const filtered = products.filter(p =>
    (p.ITEM || "").toLowerCase().includes(query) ||
    (p.CUSTOMER || "").toLowerCase().includes(query) ||
    (p.ENGINE || "").toLowerCase().includes(query)
  );

  displayResults(filtered);
});

function displayResults(list) {
  resultsDiv.innerHTML = "";

  list.forEach(item => {
    const card = `
      <div style="
        padding: 12px;
        margin-bottom: 10px;
        border-radius: 10px;
        background: #f9f9f9;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      ">
        <strong>${item.ITEM}</strong><br>
        Customer: ${item.CUSTOMER}<br>
        Price: ${item.PRICE}<br>
        Engine: ${item.ENGINE}<br>
        Quantity: ${item.QUANTITY}
      </div>
    `;
    resultsDiv.innerHTML += card;
  });
}
