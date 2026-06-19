const fs = require('fs');

const androidClientId = "512474198099-lj933ok4lah8kc1o80ites2o5an7ujq6.apps.googleusercontent.com";
const webClientId = "512474198099-lbg03gjaesa8n6vhf73c5t9f9j55t7tf.apps.googleusercontent.com";

function fixFile(filePath) {
    if (fs.existsSync(filePath)) {
        let code = fs.readFileSync(filePath, 'utf8');
        code = code.replace(new RegExp(androidClientId, 'g'), webClientId);
        fs.writeFileSync(filePath, code);
        console.log('Fixed ' + filePath);
    }
}

fixFile('src/screens/auth/Login.tsx');
fixFile('src/screens/auth/Register.jsx');
