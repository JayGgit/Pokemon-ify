const urlParams = new URLSearchParams(window.location.search)
const coordinates = urlParams.get("coordinates")
const address = urlParams.get("address")
const aiDescription = urlParams.get("aiDescription")

if (!coordinates || !address) {
    document.location.href = "/"
}

async function fillCard() {
    let houseImageURL = `/api/getImageFromCoordinates?coordinates=${encodeURIComponent(coordinates)}`
    document.getElementById("houseImage").src = houseImageURL
    let addressSplit = []
    address.split(", ").forEach((line) => {
        addressSplit.push(line)
    })
    document.getElementById("streetName").innerText = addressSplit[0]
    document.getElementById("aiDescription").innerText = aiDescription
    document.getElementById("date").innerText = new Date().getFullYear()
    document.getElementById("backDate").innerText = new Date().toLocaleDateString("en-US", {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })

    Vibrant.from(houseImageURL).getPalette()
    .then(palette => {
        console.log("Palette:", palette)
        const vibrant = palette.Vibrant.hex
        const lightVibrant = palette.LightVibrant.hex
        const darkVibrant = palette.DarkVibrant.hex
        const mutedLight = palette.LightMuted.hex
        const muted = palette.Muted.hex
        const mutedDark = palette.DarkMuted.hex


        document.getElementById("outerContainer").style.backgroundImage = `linear-gradient(135deg, ${mutedLight}, ${muted}, ${mutedDark})`
        document.getElementById("backSideContainer").style.backgroundImage = `linear-gradient(225deg, ${mutedLight}, ${muted}, ${mutedDark})`
        document.getElementById("streetName").style.color = darkVibrant
        document.getElementById("houseImage").style.borderColor = darkVibrant
        document.getElementById("aiDescription").style.color = lightVibrant
        document.getElementById("date").style.color = lightVibrant
        document.getElementById("backDate").style.color = lightVibrant
        document.getElementById("info").style.color = darkVibrant
    })
    .catch(err => console.error('Error:', err));
}

fillCard()