function resetFields(message = "Enter address", keepAddress = false) {
    document.getElementById("notificationPanel").style.display = "none"
    document.getElementById("submitAddress").disabled = false
    document.getElementById("addressInput").disabled = false
    document.getElementById("submitAddress").innerText = "Submit"
    if (!keepAddress) {
        document.getElementById("addressInput").value = ""
        document.getElementById("addressInput").placeholder = message
    }
}

async function promptForConfirmation(addressLines, formattedAddress) {
    document.getElementById("notificationPanel").style.display = "block"
    document.getElementById("confirmationAddress").innerHTML = ""

    formattedAddress.split(", ").forEach((line) => {
        document.getElementById("confirmationAddress").innerHTML += (line + "<br>")
    })

    document.getElementById("yes").addEventListener("click", async () => {
        return true
    })
    document.getElementById("no").addEventListener("click", async () => {
        resetFields(null, true)
        return false
    })
}

document.getElementById("submitAddress").addEventListener("click", async () => {
    const address = document.getElementById("addressInput").value
    if (!address) {
        return
    }
    document.getElementById("submitAddress").disabled = true
    document.getElementById("addressInput").disabled = true
    document.getElementById("submitAddress").innerText = "Loading..."

    const validateAddress = await fetch(`/api/submitAddress?address=${encodeURIComponent(address)}`)
    const validateResponse = await validateAddress.json()
    console.log(validateResponse)
    if (validateResponse.success == true) {
        if (validateResponse.edited) {
            promptForConfirmation(validateResponse.addressLines, validateResponse.formattedAddress)
        }
    }
    else {
        resetFields("Address not found")
        return
    }
})