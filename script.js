let products = [];

const url = "https://script.google.com/macros/s/AKfycbya6DEe15tzth8y931GK-zQaqAzDvw0b3fFCijzK-ihR-q5kBPge4p14hZjw1pr8LlrsA/exec";

const searchInput = document.getElementById("search");
const resultsDiv = document.getElementById("results");

async function loadData(){

    resultsDiv.innerHTML="<div class='loading'>Loading Products...</div>";

    try{

        const response = await fetch(url);

        if(!response.ok){

            throw new Error("Unable to load data");

        }

        products=await response.json();

        resultsDiv.innerHTML="<div class='loading'>Type to search products...</div>";

    }

    catch(error){

        console.log(error);

        resultsDiv.innerHTML="<div class='no-result'>Unable to connect to Google Sheet.</div>";

    }

}

loadData();

searchInput.addEventListener("input",searchProducts);

// Look up a field on a row by trying several possible header spellings,
// since Google Sheets header names can vary slightly (spacing, case, etc.)
function getField(item, keys){

    for(const key of keys){

        if(item[key] !== undefined && item[key] !== null && item[key] !== ""){

            return item[key];

        }

    }

    return "";

}

// Formats a price/amount value as INR (₹) by default.
// If the raw value already contains a $ sign, it's treated as USD instead.
function formatCurrency(raw){

    if(raw===undefined || raw===null || raw===""){

        return "-";

    }

    const str=String(raw).trim();

    const isUSD = str.includes("$");

    const num = parseFloat(str.replace(/[^0-9.]/g,""));

    if(isNaN(num)){

        return str;

    }

    if(isUSD){

        return "$" + num.toLocaleString("en-US", {maximumFractionDigits:2});

    }

    return "₹" + num.toLocaleString("en-IN", {maximumFractionDigits:2});

}

function searchProducts(){

    const query=searchInput.value.trim().toLowerCase();

    if(query===""){

        resultsDiv.innerHTML="";

        return;

    }

    const filtered=products.filter(item=>{

        return [

            getField(item,["ITEM"]),
            getField(item,["CUSTOMER"]),
            getField(item,["ENGINE"]),
            getField(item,["PRICE"]),
            getField(item,["QUANTITY"]),
            getField(item,["OUR NUMBER","OUR_NUMBER","OURNUMBER"])

        ].some(value=>

            String(value||"").toLowerCase().includes(query)

        );

    });

    displayResults(filtered);

}

function displayResults(list){

    if(list.length===0){

        resultsDiv.innerHTML="<div class='no-result'>No Products Found</div>";

        return;

    }

    resultsDiv.innerHTML=list.map(item=>{

        const itemName = getField(item,["ITEM"]) || "-";
        const customer = getField(item,["CUSTOMER"]) || "-";
        const engine = getField(item,["ENGINE"]) || "-";
        const quantity = getField(item,["QUANTITY"]);
        const unit = getField(item,["UNIT",""]);
        const price = getField(item,["PRICE"]);
        const amount = getField(item,["AMOUNT"]);
        const gst = getField(item,["GST"]);
        const ourNumber = getField(item,["OUR NUMBER","OUR_NUMBER","OURNUMBER"]);

        const qtyDisplay = quantity ? `${quantity}${unit ? " "+unit : ""}` : "-";

        return `
    <div class="card">
        <h3>${itemName}</h3>
        <div class="row"><span class="label">Customer:</span> ${customer}</div>
        <div class="row"><span class="label">Engine:</span> ${engine}</div>
        <div class="row"><span class="label">Quantity:</span> ${qtyDisplay}</div>
        <div class="row"><span class="label">Price:</span> ${formatCurrency(price)}</div>
        <div class="row"><span class="label">Amount:</span> ${formatCurrency(amount)}</div>
        ${gst ? `<div class="row"><span class="label">GST:</span> ${gst}</div>` : ""}
        ${ourNumber ? `<div class="row"><span class="label">Our No.:</span> ${ourNumber}</div>` : ""}
    </div>
    `;

    }).join("");

}
