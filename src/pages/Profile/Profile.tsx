import { Component } from "solid-js";

const Profile: Component = () => {
  const name = "Matthew";
  return (
    <div class="mx-auto w-full max-w-6xl px-6 py-12">
      <div class="flex flex-col w-full items-center gap-12">
        <h1>Hei {name}!</h1>
        <p>Velkommen til profilen din.</p>
      </div>
      {/* Profile details go here */}
    </div>
  );
};

export default Profile;
