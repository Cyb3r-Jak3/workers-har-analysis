
window.onload = function() {
    main().then();
  };

async function main() {
    const resp = await fetch(
        "/api/auth/start"
    )
    if (resp.status === 401) {
        window.location.href = "/";
    }
    console.log(resp.status)
    start(await resp.json())
}

// This function only exists so I can use async with click_function
function entry_click(clicked_id) {
    click_function(clicked_id).then()
}

async function click_function(clicked_id) {
    const resp = await fetch("/api/auth/entry", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({"entry_id": clicked_id})
    })
    if (resp.status === 200) {
        parse_entry(await resp.json())
    } else if (resp.status === 404) {
        window.location.reload(false)
    }
    // const xhr = new XMLHttpRequest();
    // xhr.open("POST", "/api/entry_choice", true);
    // xhr.setRequestHeader("Content-Type", "application/json");

    // xhr.onreadystatechange = function () {
    //     if (xhr.readyState === 4 && xhr.status === 200) {
    //         parse_entry(JSON.parse(xhr.responseText))
    //     }
    //     if (xhr.readyState === 4 && xhr.status === 404) {
    //         window.location.reload(false)
    //     }
    // }
    // const data = JSON.stringify({"entry_id": clicked_id});
    // xhr.withCredentials = true;
    // xhr.send(data);
}


function start(response) {
    parentDiv = document.getElementById("entry-list");
    entries = response["log"]["entries"];
    entries.forEach((element, index) => {
        var div = document.createElement("div");
        if (element["response"]["status"] === 200) {
            div.className = "good_entry";
        } else if ( element["response"]["status"] === 500) {
            div.className = "bad_entry";
        } else {
            div.className = "entry";
        }
        div.setAttribute("onclick", `entry_click(${index})`)
        const status = document.createElement("p");
        status.innerHTML = `<b>Status:</b> ${element["response"]["status"]} <b>URL:</b> ${element["request"]["url"]}`
        const ip = document.createElement("p");
        ip.innerHTML = `<b>IP:</b> ${element["serverIPAddress"]}`
        div.appendChild(status)
        div.appendChild(ip)
        parentDiv.appendChild(div);
    });
}

function parse_entry(response) {
    document.getElementById("secureState").innerText = response["_securityState"];
    document.getElementById("port").innerText = response.connection;
    document.getElementById("IP").innerText = response.serverIPAddress;
    document.getElementById("startDate").innerText = response.startedDateTime;
    document.getElementById("time").innerText = response.time;
    document.getElementById("request_body").innerText = response.request.bodySize;
    document.getElementById("headerSize").innerText = response.request.headersSize;
    document.getElementById("method").innerText = response.request.method;
    document.getElementById("HTTPversion").innerText = response.request.httpVersion;
    document.getElementById("URL").innerText = response.request.url;
    document.getElementById("response_body").innerText = response.response.bodySize;
    document.getElementById("mimeType").innerText = response.response.content.mimeType;
    document.getElementById("response_content").innerText = response.response.content.text;
}

function changeTab(evt, tabName) {
    let i, tabcontent, tablinks;

    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}