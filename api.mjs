export async function addressToCoordinates(req, res, addressvalidationClient) {
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
    return res.status(200).json({
        success: true,
        edited: response[0].result.verdict.hasInferredComponents,
        formattedAddress: response[0].result.address.formattedAddress,
        addressLines: response[0].result.address.postalAddress.addressLines,
        geoCode: response[0].result.geocode.location,
        coordinates: response[0].result.geocode.location.latitude + "," + response[0].result.geocode.location.longitude,
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
        size: "500x500",
    }

    if (await findIfImageExists()) {
        let image = await getImage()
        res.set("Content-Type", "image/jpeg")
        return res.status(200).send(Buffer.from(image.data, "binary"))
    }
}