import axios from "axios";

const handleLogin = async () => {
  console.log("STEP 1");

  try {
    console.log("STEP 2");

    const response = await axios.post(
      "https://8145-43-241-144-62.ngrok-free.app/api/User/login",
      {
        name: "kunal",
        password: "123",
      },
      {
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    console.log("STEP 3");
    console.log(response.data);
  } catch (e: any) {
    console.log("STEP 4");
    console.log(e.message);
    console.log(e.response?.data);
  }
};
