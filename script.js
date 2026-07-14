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

function searchProducts(){

    const query=searchInput.value.trim().toLowerCase();

    if(query===""){

        resultsDiv.innerHTML="";

        return;

    }

    const filtered=products.filter(item=>{

        return [

            item.ITEM,

            item.CUSTOMER,

            item.ENGINE,

            item.PRICE,

            item.QUANTITY

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

    resultsDiv.innerHTML=list.map(item=>`

    <div class="card">

        <h3>${item.ITEM || "-"}</h3>

        <div class="row"><span class="label">Customer:</span> ${item.CUSTOMER || "-"}</div>

        <div class="row"><span class="label">Engine:</span> ${item.ENGINE || "-"}</div>

        <div class="row"><span class="label">Price:</span> $${item.PRICE || "-"}</div>

        <div class="row"><span class="label">Quantity:</span> ${item.QUANTITY || "-"}</div>

    </div>

    `).join("");

}
