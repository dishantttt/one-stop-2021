const fs = require('fs');
const xlsx = require('node-xlsx');
const path = require('path');
const MessMenu = require('../models/messMenuModel');
const User = require('../models/userModel');
const PrivateKey = require('../models/privatekeyModel');
const crypto = require('crypto');


const createMeal = (description, startTime, endTime) => {
  const currentDate = new Date();
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startTiming = new Date(currentDate);
  startTiming.setHours(startHour, startMinute, 0, 0);
  startTiming.setMinutes(startTiming.getMinutes() - 330);

  const endTiming = new Date(currentDate);
  endTiming.setHours(endHour, endMinute, 0, 0);
  endTiming.setMinutes(endTiming.getMinutes() - 330); 

  return {
    mealDescription: description,
    startTiming: startTiming,
    endTiming: endTiming
  };
};

const timings = {
  breakfast: { start: '07:00', end: '09:30' },
  lunch: { start: '12:00', end: '14:15' },
  dinner: { start: '19:30', end: '21:45' }
};

const weekendtimings = {
  breakfast: { start: '08:00', end: '10:30' },
  lunch: { start: '12:15', end: '14:30' },
  dinner: { start: '20:00', end: '22:15' }
}


async function UpdateUser(filePath) {
  try {
    const workSheetsFromFile = xlsx.parse(fs.readFileSync(filePath));
    const sheet = workSheetsFromFile[0].data;
    for (let i = 1; i < sheet.length; i++) {
      const row = sheet[i];
      const rollNumber = row[1];
      
      const user = await User.findOne({ rollNo:rollNumber });
      
      if (user) {
        user.hostel = row[2].toLocaleUpperCase();
        await user.save();
      } else {
        console.log(`User with Roll Number: ${rollNumber} not found`);
      }
    }

    console.log('All rows processed.');
    return { message: 'All rows processed successfully' };
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
}

async function UpdateUserMess(filePath) {
  try {
    const workSheetsFromFile = xlsx.parse(fs.readFileSync(filePath));
    const sheet = workSheetsFromFile[0].data;
    for (let i = 1; i < sheet.length; i++) {
      const row = sheet[i];
      const rollNumber = row[1];
      
      const user = await User.findOne({ rollNo:rollNumber });
      
      if (user) {
        user.subscribedMess = row[2].toLocaleUpperCase();
        await user.save();
      } else {
        console.log(`User with Roll Number: ${rollNumber} not found`);
      }
    }

    console.log('All rows processed.');
    return { message: 'All rows processed successfully' };
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
}

async function saveMessMenuForHostel(filePath, hostelName) {
  try {
    const workSheetsFromFile = xlsx.parse(fs.readFileSync(filePath));
    const sheet = workSheetsFromFile[0].data;
    const days = sheet.slice(1).map(row => ({
      day: row[0],
      breakfast: row[1],
      lunch: row[2],
      dinner: row[3]
    }));

    const messMenu = {
      hostel: hostelName,
      monday: {
        breakfast: createMeal(days[0].breakfast, timings.breakfast.start, timings.breakfast.end),
        lunch: createMeal(days[0].lunch, timings.lunch.start, timings.lunch.end),
        dinner: createMeal(days[0].dinner, timings.dinner.start, timings.dinner.end)
      },
      tuesday: {
          breakfast: createMeal(days[1].breakfast, timings.breakfast.start, timings.breakfast.end),
          lunch: createMeal(days[1].lunch, timings.lunch.start, timings.lunch.end),
          dinner: createMeal(days[1].dinner, timings.dinner.start, timings.dinner.end)
      },
      wednesday: {
          breakfast: createMeal(days[2].breakfast, timings.breakfast.start, timings.breakfast.end),
          lunch: createMeal(days[2].lunch, timings.lunch.start, timings.lunch.end),
          dinner: createMeal(days[2].dinner, timings.dinner.start, timings.dinner.end)
      },
      thursday: {
          breakfast: createMeal(days[3].breakfast, timings.breakfast.start, timings.breakfast.end),
          lunch: createMeal(days[3].lunch, timings.lunch.start, timings.lunch.end),
          dinner: createMeal(days[3].dinner, timings.dinner.start, timings.dinner.end)
      },
      friday: {
          breakfast: createMeal(days[4].breakfast, timings.breakfast.start, timings.breakfast.end),
          lunch: createMeal(days[4].lunch, timings.lunch.start, timings.lunch.end),
          dinner: createMeal(days[4].dinner, timings.dinner.start, timings.dinner.end)
      },
      saturday: {
          breakfast: createMeal(days[5].breakfast, weekendtimings.breakfast.start, weekendtimings.breakfast.end),
          lunch: createMeal(days[5].lunch, weekendtimings.lunch.start, weekendtimings.lunch.end),
          dinner: createMeal(days[5].dinner, weekendtimings.dinner.start, weekendtimings.dinner.end)
      },
      sunday: {
          breakfast: createMeal(days[6].breakfast, weekendtimings.breakfast.start, weekendtimings.breakfast.end),
          lunch: createMeal(days[6].lunch, weekendtimings.lunch.start, weekendtimings.lunch.end),
          dinner: createMeal(days[6].dinner, weekendtimings.dinner.start, weekendtimings.dinner.end)
      }        
     
    };
    await MessMenu.findOneAndUpdate({ hostel: hostelName }, messMenu, { upsert: true, new: true });

    console.log(`Menu for ${hostelName} processed successfully`, messMenu);
  } catch (error) {
    throw new Error(`Error processing menu for ${hostelName}: ${error.message}`);
  }
}


exports.uploadmessmenu =  async (req, res) => {
  try {
    console.log('File upload request received');

    if (!req.files) {
      console.log('No file uploaded');
      return res.status(400).send('No file uploaded');
    }

    req.files.forEach(async(file) => {
        console.log(file.filename)
        const filePath = path.join(__dirname, '/../files_folder/mess_menu_files', file.filename);
        const hostelName = file.filename.split('.').slice(0, -1).join('.');
        console.log('Processing users with hostelName:', hostelName);
        try {
            await saveMessMenuForHostel(filePath, hostelName.toLocaleUpperCase());
            console.log('Mess menu saved successfully.');
        } catch (error) {
            console.error('Error during saveMessMenuForHostel:', error.message);
            return res.status(500).send(`Error processing menu for ${hostelName}: ${error.message}`);
        }
    });

    // Success response
    res.render('response.ejs');

  } catch (error) {
    console.error('Error during upload and processing:', error.message);
    res.status(500).send('An error occurred while processing the hostel menu');
  }
}

function wrapWithRSAKeys(data) {
  const publicKeyHeader = '-----BEGIN RSA PRIVATE KEY-----\n';
  const privateKeyFooter = '\n-----END RSA PRIVATE KEY-----';
  
  return publicKeyHeader + data + privateKeyFooter;
}

exports.uploaduserHostel = async (req,res) => {
  try {

    if(!req.file){
      console.log('No file uploaded');
      return res.status(400).send('No file uploaded');
    }

    const publicKey = `${req.body.publicKey}`;
    console.log(publicKey);
    const privateKeyModel = await PrivateKey.findOne({});
    const private = `${privateKeyModel.privateKey}`;
    const privateKey = wrapWithRSAKeys(private);
    console.log(privateKey);

    const message = "This is a test message";
    // Encrypt the message using the public key
    const encryptedMessage = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      Buffer.from(message)
    );
    console.log("Encrypted Message:", encryptedMessage.toString('base64'));

    // Decrypt the message using the private key
    const decryptedMessage = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      encryptedMessage
    );
    const checkmessage = decryptedMessage.toString();
    if(checkmessage !== message){
      return res.status(400).send('Decryption failed');
    }

    const filePath = path.join(__dirname, '/../files_folder/hostel_upload', req.file.filename);
    const fname = req.file.filename.split('.').slice(0, -1).join('.');
    console.log('Processing users of file:', fname);
    try {
        await UpdateUser(filePath);
        console.log('Data saved successfully.');
    } catch (error) {
        console.error('Error during saving data:', error.message);
        return res.status(500).send(`Error processing file: ${error.message}`);
    }
    res.render('response.ejs');
  } catch (error) {
    console.error('Error during file upload:', error.message);
    res.status(500).send('An error occurred during file upload');
  }
}


exports.uploaduserMess = async (req,res) => {
  try {

    if(!req.file){
      console.log('No file uploaded');
      return res.status(400).send('No file uploaded');
    }

    const publicKey = `${req.body.publicKey}`;
    console.log(publicKey);
    const privateKeyModel = await PrivateKey.findOne({});
    const private = `${privateKeyModel.privateKey}`;
    const privateKey = wrapWithRSAKeys(private);
    console.log(privateKey);

    const message = "This is a test message";
    // Encrypt the message using the public key
    const encryptedMessage = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      Buffer.from(message)
    );
    console.log("Encrypted Message:", encryptedMessage.toString('base64'));

    // Decrypt the message using the private key
    const decryptedMessage = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      encryptedMessage
    );
    const checkmessage = decryptedMessage.toString();
    if(checkmessage !== message){
      return res.status(400).send('Decryption failed');
    }

    const filePath = path.join(__dirname, '/../files_folder/hostel_upload', req.file.filename);
    const fname = req.file.filename.split('.').slice(0, -1).join('.');
    console.log('Processing users of file:', fname);
    try {
        await UpdateUserMess(filePath);
        console.log('Data saved successfully.');
    } catch (error) {
        console.error('Error during saving data:', error.message);
        return res.status(500).send(`Error processing file: ${error.message}`);
    }
    res.render('response.ejs');
  } catch (error) {
    console.error('Error during file upload:', error.message);
    res.status(500).send('An error occurred during file upload');
  }
}
