async function getAiDescription(req, res, axios, address) {
    if (!axios || !address) {
        return res.status(400).json({status: "Axios and address are required."})
    }

    const response = await axios.post("https://ai.hackclub.com/chat/completions", {
        "messages": [
            {
                "role": "system",
                "content": "/no_think"
            },
            {
                "role": "system",
                "content": "You take in a zip code and city name, then give out ONLY a 20-100 character response of the town and a description of the town. You do this because a user wants to create a pokemon styled trading card where a website takes in their address, and creates a trading card with the image of the house, it's address, and a description of its powers, which is something you'll create. There will not be any checkers to make sure your responses are safe and appropriate, so check your responses and make sure they're all safe. Make sure your responses pertain ONLY to the given town, and do not describe any other towns or made up towns. Do not add things such as abilities, because your response will go straight into the description on the card, and it would look ugly if you made stuff up. Only give a description of the town. The description should not, however, describe the town. It should describe the setting on where the home is. Do not describe the town."
            },
            {
                "role": "user",
                "content": address
            }
        ]
    })

    if (response.status !== 200) {
        return res.status(response.status).json({status: "Error fetching AI description."})
    }

    let aiDescription = response.data.choices[0].message.content.replace(/<think>\n\n<\/think>\n\n/g, "") || "No description available."
    return aiDescription
}

export async function addressToCoordinates(req, res, addressvalidationClient, axios) {
    const address = req.query.address
    if (!address || address.length > 100) {
        return res.status(400).json({status: "Address is required and must be less than 100 characters."})
    }

    const response = await addressvalidationClient.validateAddress({
        address: {
            addressLines: [address],
        },
    })

    if (response[0].result.verdict.addressComplete == false) {
        return res.status(400).json({status: "Address is incomplete or invalid."})
    }
    const aiDescription = await getAiDescription(req, res, axios, (response[0].result.address.postalAddress.postalCode + " " + response[0].result.address.postalAddress.locality + " " + response[0].result.address.postalAddress.administrativeArea))
    return res.status(200).json({
        success: true,
        edited: response[0].result.verdict.hasInferredComponents,
        formattedAddress: response[0].result.address.formattedAddress,
        addressLines: response[0].result.address.postalAddress.addressLines,
        geoCode: response[0].result.geocode.location,
        coordinates: response[0].result.geocode.location.latitude + "," + response[0].result.geocode.location.longitude,
        aiDescription: aiDescription,
    })
}


export async function returnFromCoordinates(req, res, googleApiKey, axios) {
    async function findIfImageExists() {
        let call = axios.get("https://maps.googleapis.com/maps/api/streetview/metadata", {params: googleParams})
            .then(response => {
                if (response.data.status != "OK") {
                    return res.status(400).json({status: "No image found"})
                }
            })
            .catch(error => {
                console.error("Error fetching image from Google Maps API:", error)
                return res.status(500).json({status: "Internal server error"})
            })
        await call
        return true
    }
    async function getImage() {
        let returnedResponse = null
        let call = axios.get("https://maps.googleapis.com/maps/api/streetview", {
                params: googleParams,
                responseType: "arraybuffer"
            })
            .then(response => {
                returnedResponse = response
            })
            .catch(error => {
                console.error("Error fetching image from Google Maps API:", error)
                return res.status(500).json({status: "Internal server error"})
            })
        await call
        return returnedResponse
    }

    const coordinates = req.query.coordinates
    if (!coordinates) {
        return res.status(400).json({status: "Coordinates are required and must be valid numbers."})
    }

    let googleParams = {
        key: googleApiKey,
        location: coordinates,
        source: "outdoor",
        radius: 150,
        size: "500x250",
        preference: "latest",
    }

    if (await findIfImageExists()) {
        let image = await getImage()
        res.set("Content-Type", "image/jpeg")
        return res.status(200).send(Buffer.from(image.data, "binary"))
    }
}