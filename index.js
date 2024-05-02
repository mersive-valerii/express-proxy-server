const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const { writeFile } = require('fs').promises; // Import the writeFile method
const FormData = require('form-data');
const { Buffer } = require('buffer');

const app = express();

const port = 80;



app.use(cors({ origin: "*" }));
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded data

const agent = new https.Agent({  
    rejectUnauthorized: false
  });

// Define a route that uses the controller
app.get('/', (req, res) => {
    res.status(200).send({ status: 200, message: "Ping" });
});

app.get('/compliment', (req, res) => {
    const compliments = [
        "You're an awesome friend.",
        "This will be modified - HEHE lets see if it is deployed!",
    ];

    const randomIndex = Math.floor(Math.random() * compliments.length);
    const randomCompliment = compliments[randomIndex];

    res.status(200).send({ status: 200, message: randomCompliment });
});


// Handle file upload
app.post('/upload', async (req, res) => {
    try {
        const { podIp, podPassword } = req.body;

        // Access the file data using req.files
        const { files } = req;

        if (!podIp) {
            res.status(400).send("Please provide Pod IP address");
            return;
        }

        if (!files) {
            res.status(400).send("Please select a license file");
            return;
        }

        const url = `http://${podIp}/Config/service/uploadLicense`;

        const uploadedFile = files.LICENSE_pkg;

        // Create a FormData object
        const formData = new FormData();

        const auth = {
            username: 'admin',
            password: podPassword,
        };

        // Convert uploadedFile.data to a Buffer and append it to FormData
        formData.append('LICENSE_pkg', Buffer.from(uploadedFile.data), { filename: uploadedFile.name });

        // Make the Axios POST request with FormData
        const response = await axios.post(url, formData, {
            headers: {
              ...formData.getHeaders(),
            },
            auth: {
              username: auth.username,
              password: auth.password,
            },
            httpsAgent: agent,
          })

        const responseData = response.data;

        console.log(response.status);
        console.log(responseData.message);

        if (responseData.passwordRequired === true) {
            res.status(400).send({ status: 400, message: "Please provide a password" });
            return;
        }

        if (response.status === 200) {
            res.status(200).send({ status: response.status, message: responseData.message });
        }

        if (responseData.message === "timeout of 5000ms exceeded") {
            console.log(response.status)
            console.log(response)
            res.status(400).send({ status: response.status, message: "timeout of 5000ms exceeded" });
        }

        console.log(response.data)
        console.log(response.status)


    } catch (error) {

        if (error.message && error.message === "timeout of 5000ms exceeded") {
            console.error("Error first catch:", error.message);
            res.status(400).send({ status: 400, message: "timeout of 5000ms exceeded" });
            return;
        }

        if (error.message && error.message.startsWith("connect ENETUNREACH")) {
            console.error("Error second catch:", error.message);
            res.status(400).send({ status: 400, message: "can not connect" });
            return;
        }

        console.error("Error last catch:", error.message);
        res.status(400).send({ status: 400, message: "socket hangs up" });
    }
});

// Conditionally start the server only if this file is the main process
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

module.exports = app;  // Export for testing