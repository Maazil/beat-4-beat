import { Component } from "solid-js";

const Profile: Component = () => {

    const name = "Matthew";
  return (
    <div>
      <h1>User Profile</h1>
      <p>Hi {name}!</p>
      {/* Profile details go here */}
    </div>
  );
};

export default Profile;