import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv';
dotenv.config()
import { GoogleDriveService } from '../helpers/googleDriveService.js';

const driveClientId = process.env.GCLOUD_CLIENT_ID || '';
const driveClientSecret = process.env.GCLOUD_CLIENT_SECRET || '';
const driveRedirectUri = process.env.GCLOUD_REDIRECT_URI || '';
const driveRefreshToken = process.env.GCLOUD_REFRESH_TOKEN || '';

export const handleImgUpload = async (req,res) => {
    try {
        const googleDriveService = new GoogleDriveService(driveClientId, driveClientSecret, driveRedirectUri, driveRefreshToken);
        const filePath = req.file.path;
        const folderName = 'QuestionImages';
    
        let folder = await googleDriveService.searchFolder(folderName).catch((error) => {
          console.error(error);
          return null;
        });
    
        if (!folder) {
          folder = await googleDriveService.createFolder(folderName);
        }
    
        const driveResponse = await googleDriveService.saveFile(req.file.originalname, filePath, req.file.mimetype, folder.id).catch((error) => {
          console.error(error);
          throw new Error('File upload to Google Drive failed');
        });
    
        // Delete the file from the server after uploading
        fs.unlinkSync(filePath);
    
        res.json({error: false,imageUrl: `https://lh3.googleusercontent.com/d/${driveResponse.data.id}` });
    } catch (error) {
        console.error(error);
        return res.json({error:false,message : "Image upload failed"})
    }
}

export const handleImageDelete = async (req,res) => {
    try{
        let { imgUrl } = req.body
        if(!imgUrl){return res.json({error:true,message:"Image url is necessary to delete the image"})}
        let imageId = imgUrl.split('/')[imgUrl.split('/').length-1]
        console.log(imageId)
        const googleDriveService = new GoogleDriveService(driveClientId, driveClientSecret, driveRedirectUri, driveRefreshToken);
        await googleDriveService.deleteFile(imageId)
        console.log('Image ',imageId,' deleted')
        return res.json({error:false,message:"File deleted"})
    } catch(err){
        console.error(err);
        return res.json({error:false,message : "Failed to delete the image"})
    }
}