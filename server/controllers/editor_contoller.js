import Projects from "../model/Project.js";
import Users from "../model/User.js";
import jwt from "jsonwebtoken";
import Editor from "../model/Editor.js";

export default function (io) {
  const requestQueue = []; // FCFS queue to store incoming requests
  let isProcessing = false; // Flag to track if a request is currently being processed

  const home = async function (req, res) {
    res.send("Editor Router is working");
  };

  const processNextRequest = async function () {
    console.log('processNextRequest....');
    if (isProcessing || requestQueue.length === 0) {
      return; // If a request is already being processed or the queue is empty, exit the function
    }

    isProcessing = true; // Set the flag to indicate that a request is being processed

    const { req, res } = requestQueue.shift(); // Get the next request from the queue
    // console.log(req);
    try {
      await Projects.findByIdAndUpdate(req.body.project_id, {
        editor: req.body.contents,
      });

      io.sockets.in(req.body.project_id).emit("sync-data", {
        contents: req.body.contents,
      });

      res.status(201).send({
        success: true,
        message: "Editor contents saved",
      });
    } catch (err) {
      res.status(404).send({
        success: false,
        message: `error : ${err}`,
      });
      
    }
    
    isProcessing = false; // Reset the flag to indicate that the request processing is complete

    processNextRequest(); // Process the next request in the queue
  };

  const saveEditor = function (req, res) {
    console.log('saveEditor called....');
    requestQueue.push({ req, res }); // Add the current request to the queue
    processNextRequest(); // Start processing the requests if not already in progress
  };

  return {
    home,
    saveEditor,
  };
}
