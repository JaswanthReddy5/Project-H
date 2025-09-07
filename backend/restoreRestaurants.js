const mongoose = require("mongoose");
require("dotenv").config();

// Restore restaurant data to database
async function restoreRestaurants() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔄 Connected to MongoDB to restore restaurant data");

    // Get the Restaurant model
    const Restaurant = mongoose.model('Restaurant', new mongoose.Schema({
      name: String,
      description: String,
      imageUrl: String,
      menuUrl: String,
      phoneNumber: String,
      category: String,
      isActive: { type: Boolean, default: true },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }));

    // Sample restaurant data
    const restaurants = [
      {
        name: "Andra Tiffins&Snakes",
        description: "Authentic Hyderabadi Biryani and Indian cuisine",
        imageUrl: "https://drive.google.com/thumbnail?id=1uH2xPK0n2DE1jIxH3cr9ML_CM0LjovLw",
        menuUrl: "https://drive.google.com/file/d/1hkMRslqFPQ76LrfJ4UNvfErongZ6_ZH3/view?usp=sharing",
        phoneNumber: "9059937090",
        category: "Indian",
        isActive: true
      },
      {
        name: "Butty",
        description: "Authentic Chinese cuisine",
        imageUrl: "https://drive.google.com/thumbnail?id=1yqr0YzQEa_ZEvS_K9qDPpoR-dgsjZJ3P",
        menuUrl: "https://drive.google.com/file/d/1h0JKN3MjiK0jGc9mjusumERr-JT1dh3p/view",
        phoneNumber: "7200318905",
        category: "Chinese",
        isActive: true
      },
      {
        name: "Sunny Days",
        description: "Authentic Hyderabadi Biryani and Indian cuisine",
        imageUrl: "https://drive.google.com/thumbnail?id=1yd1V_jk-XHlISUutbsTmRHaO-Jt4lU7A",
        menuUrl: "https://drive.google.com/file/d/1hG9vdTpduY-CYbWtJgu2pAMwhdQCAPiU/view?usp=sharing",
        phoneNumber: "9381878144",
        category: "Indian",
        isActive: true
      },
      {
        name: "Chocomans Cakes",
        description: "Authentic Hyderabadi Biryani and Indian cuisine",
        imageUrl: "https://drive.google.com/thumbnail?id=1ygO9Dnsbelc_4pm6lcmDOoEJAt5nuBLD",
        menuUrl: "https://drive.google.com/file/d/1hlI-R4sQoXKbaV5CzCyIL-kYTIonUspw/view?usp=sharing",
        phoneNumber: "9176160631",
        category: "Indian",
        isActive: true
      },
      {
        name: "Kings Plaza",
        description: "Authentic Hyderabadi Biryani and Indian cuisine",
        imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        menuUrl: "https://drive.google.com/file/d/1iQmYbTPBYi20-nlcJvUF3K57aCZOTCPf/view?usp=sharing",
        phoneNumber: "9176160631",
        category: "Indian",
        isActive: true
      },
      {
        name: "Sohana Biryani House",
        description: "Authentic Hyderabadi Biryani and Indian cuisine",
        imageUrl: "https://drive.google.com/thumbnail?id=1y_Ew7TnmOqPE1QqgSILqQiH0TNkOiAr2",
        menuUrl: "https://drive.google.com/file/d/1hlB_Pe4PqzhiD8TYoMzKJ7hTuQYC1nxT/view?usp=sharing",
        phoneNumber: "6379887543",
        category: "Indian",
        isActive: true
      },
      {
        name: "Milan",
        description: "Authentic Hyderabadi Biryani and Indian cuisine",
        imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        menuUrl: "https://drive.google.com/file/d/1hh3c9Do16vpuK-Z1PYPu7B48zd9dHJRX/view?usp=sharing",
        phoneNumber: "9363467122",
        category: "Indian",
        isActive: true
      },
      {
        name: "Google+",
        description: "Authentic Hyderabadi Biryani and Indian cuisine",
        imageUrl: "https://drive.google.com/thumbnail?id=1yXz-uOKA8K-wjn3FIg03XGVQTeOrYHpZ",
        menuUrl: "https://drive.google.com/file/d/1hjWV0mtwOWq_I37ntFQ1LsKPEU9-QIY7/view?usp=sharing",
        phoneNumber: "9940383952",
        category: "Indian",
        isActive: true
      },
      {
        name: "Zinger",
        description: "Famous Hyderabadi biryani with authentic taste",
        imageUrl: "https://drive.google.com/thumbnail?id=1lQt315Y24SpUpnUdCRdvlIb-3Q2qW_ph",
        menuUrl: "https://drive.google.com/file/d/1-6Fe48xkumNYYf3oTzo8BWmFGk4CDVnf/view?usp=sharing",
        category: "Indian",
        isActive: true
      },
      {
        name: "Masaledar",
        description: "Famous Hyderabadi biryani with authentic taste",
        imageUrl: "https://drive.google.com/thumbnail?id=1-EXRlGBBi6PBF2R6mdPxXS2U368P8FpB",
        menuUrl: "https://drive.google.com/file/d/1-RSIRR896iIRhAsSvfmsibHUyYzD0OfT/view?usp=sharing",
        phoneNumber: "9102770111",
        category: "Indian",
        isActive: true
      },
      {
        name: "EVERGREEN",
        description: "Famous Hyderabadi biryani with authentic taste",
        imageUrl: "https://drive.google.com/thumbnail?id=1-EYAV5SIZXdDn2gSECkb9wWuS14dgbFP",
        menuUrl: "https://drive.google.com/file/d/1-XVPpqm9JGJLyySzNDjX39EUY0Nawfxv/view?usp=sharing",
        phoneNumber: "9962372887",
        category: "Indian",
        isActive: true
      },
      {
        name: "Shakes and Desserts",
        description: "Famous Hyderabadi biryani with authentic taste",
        imageUrl: "https://drive.google.com/thumbnail?id=1-F1AM50T7WFuam-5hdhJn30HJJkTg1RV",
        menuUrl: "https://drive.google.com/file/d/1-VcH6ja7-yw4_1AP0aF69GIcjVsNEup1/view?usp=sharing",
        phoneNumber: "9876543210",
        category: "Indian",
        isActive: true
      },
      {
        name: "Classic Chettinadu Restaurent",
        description: "Famous Hyderabadi biryani with authentic taste",
        imageUrl: "https://drive.google.com/thumbnail?id=1-iHK8z4UBFMU2BN5AwtMSaxV-tOWdQ-k",
        menuUrl: "https://drive.google.com/file/d/1-fFAHBxHuP4l-sFxNKXNu2dVyzj-bRjL/view?usp=sharing",
        phoneNumber: "7358751201",
        category: "Indian",
        isActive: true
      }
    ];

    // Insert restaurants
    const result = await Restaurant.insertMany(restaurants);
    console.log(`✅ Restored ${result.length} restaurants to database`);
    
    // Close connection
    await mongoose.connection.close();
    console.log("🔄 Database connection closed");
    
  } catch (error) {
    console.error("❌ Restaurant restoration failed:", error);
  }
}

// Run the restoration
restoreRestaurants();
