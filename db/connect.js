import mongoose from "mongoose";
export default async function connect() {
  try {
    const connectionInstance = await mongoose.connect(
      `mongodb+srv://${process.env.mongodb_username}:${process.env.mongodb_password}@cluster0.hoyxc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
    );
    console.log("connected to mongodb");
  } catch (error) {
    console.log("error connection refused", error);
  }
}
