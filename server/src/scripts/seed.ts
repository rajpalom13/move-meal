import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import config from '../config/index.js';
import User from '../models/User.js';
import FoodCluster from '../models/FoodCluster.js';
import RideCluster from '../models/RideCluster.js';

const MONGODB_URI = config.mongodb.uri;

// Test users data
const testUsers = [
  {
    email: 'test1@gmail.com',
    phone: '+919876543001',
    name: 'Test User 1',
    college: 'Thapar University',
    gender: 'male' as const,
    isVerified: true,
  },
  {
    email: 'test2@gmail.com',
    phone: '+919876543002',
    name: 'Test User 2',
    college: 'Punjabi University',
    gender: 'female' as const,
    isVerified: true,
  },
  {
    email: 'test3@gmail.com',
    phone: '+919876543003',
    name: 'Test User 3',
    college: 'Government Medical College Patiala',
    gender: 'male' as const,
    isVerified: true,
  },
  {
    email: 'test4@gmail.com',
    phone: '+919876543004',
    name: 'Test User 4',
    college: 'Multani Mal Modi College',
    gender: 'female' as const,
    isVerified: true,
  },
  {
    email: 'test5@gmail.com',
    phone: '+919876543005',
    name: 'Test User 5',
    college: 'Government Bikram College',
    gender: 'other' as const,
    isVerified: true,
  },
];

const PASSWORD = '12345678';

// Patiala area coordinates for realistic data
const locations = [
  { lat: 30.3398, lng: 76.3869, address: 'Thapar University, Patiala' },
  { lat: 30.3522, lng: 76.3870, address: 'Punjabi University, Patiala' },
  { lat: 30.3340, lng: 76.4020, address: 'Sheranwala Gate, Patiala' },
  { lat: 30.3300, lng: 76.3950, address: 'Fountain Chowk, Patiala' },
  { lat: 30.3200, lng: 76.3850, address: 'Rajpura Road, Patiala' },
  { lat: 30.3450, lng: 76.3750, address: 'Patiala Bus Stand' },
  { lat: 30.3380, lng: 76.3920, address: 'Leela Bhawan, Patiala' },
  { lat: 30.3280, lng: 76.4100, address: 'The Mall Road, Patiala' },
  { lat: 30.3500, lng: 76.3650, address: 'Urban Estate, Patiala' },
  { lat: 30.3150, lng: 76.4000, address: 'Model Town, Patiala' },
  { lat: 30.9010, lng: 75.8573, address: 'Ludhiana' },
  { lat: 30.7333, lng: 76.7794, address: 'Chandigarh' },
  { lat: 30.3782, lng: 76.7767, address: 'Zirakpur' },
  { lat: 30.2110, lng: 76.3710, address: 'Rajpura' },
  { lat: 30.3600, lng: 76.3500, address: 'Tripuri, Patiala' },
];

const restaurants = [
  { name: 'Dominos Pizza', address: 'Leela Bhawan, Patiala' },
  { name: 'McDonalds', address: 'The Mall Road, Patiala' },
  { name: 'Subway', address: 'Fountain Chowk, Patiala' },
  { name: 'Burger King', address: 'Sheranwala Gate, Patiala' },
  { name: 'KFC', address: 'Urban Estate, Patiala' },
  { name: 'Pizza Hut', address: 'Rajpura Road, Patiala' },
  { name: 'Sagar Ratna', address: 'The Mall Road, Patiala' },
  { name: 'Baba Chicken', address: 'Tripuri, Patiala' },
  { name: 'Giani Di Hatti', address: 'Fountain Chowk, Patiala' },
  { name: 'Haveli Restaurant', address: 'Sheranwala Gate, Patiala' },
  { name: 'Baskin Robbins', address: 'Leela Bhawan, Patiala' },
  { name: 'Punjabi Dhaba', address: 'Bus Stand, Patiala' },
  { name: 'Pind Balluchi', address: 'Urban Estate, Patiala' },
  { name: 'Cafe Coffee Day', address: 'Thapar University Gate' },
  { name: 'Ahuja Lassi', address: 'Near Punjabi University' },
];

const foodItems = [
  '1x Margherita Pizza, 1x Garlic Bread',
  '2x McSpicy Burger, 1x French Fries, 2x Coke',
  '1x Veg Sub, 1x Cookie',
  '1x Whopper Meal, 1x Onion Rings',
  '2x Chicken Bucket, 1x Coleslaw',
  '1x Paneer Pizza, 1x Pasta',
  '1x Chole Bhature, 2x Sweet Lassi',
  '1x Butter Chicken, 2x Naan, 1x Raita',
  '2x Cold Coffee, 1x Brownie',
  '3x Masala Chai, 4x Samosa',
  '2x Amritsari Kulcha, 1x Chole',
  '1x Tandoori Chicken, 2x Roomali Roti',
  '1x Chicken Biryani, 1x Raita',
  '2x Ice Cream Sundae, 1x Waffle',
  '2x Mango Lassi, 2x Paratha',
];

async function clearDatabase() {
  console.log('Clearing existing test data...');

  // Delete test users and their associated data
  const testEmails = testUsers.map(u => u.email);
  await User.deleteMany({ email: { $in: testEmails } });

  // Clear all clusters (for fresh start)
  await FoodCluster.deleteMany({});
  await RideCluster.deleteMany({});

  console.log('Database cleared');
}

async function createUsers() {
  console.log('Creating test users...');

  const hashedPassword = await bcrypt.hash(PASSWORD, 12);

  const users = await Promise.all(
    testUsers.map(async (userData) => {
      const user = await User.create({
        ...userData,
        password: hashedPassword,
        location: {
          type: 'Point',
          coordinates: [locations[Math.floor(Math.random() * locations.length)].lng,
                        locations[Math.floor(Math.random() * locations.length)].lat],
        },
      });
      console.log(`Created user: ${userData.email}`);
      return user;
    })
  );

  return users;
}

async function createFoodClusters(users: any[]) {
  console.log('Creating food clusters...');

  const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();
  const clusters = [];

  // Helper to create a food cluster
  const createCluster = async (config: {
    title: string;
    creatorIndex: number;
    restaurantIndex: number;
    locationIndex: number;
    minimumBasket: number;
    currentTotal: number;
    maxMembers: number;
    hoursFromNow: number;
    status: string;
    notes: string;
    members: { userIndex: number; amount: number; items: string; hoursAgo: number; hasCollected?: boolean; hasOtp?: boolean }[];
  }) => {
    const memberData = config.members.map((m) => ({
      user: users[m.userIndex]._id,
      orderAmount: m.amount,
      items: m.items,
      joinedAt: new Date(Date.now() - m.hoursAgo * 60 * 60 * 1000),
      hasCollected: m.hasCollected || false,
      collectedAt: m.hasCollected ? new Date(Date.now() - 10 * 60 * 1000) : undefined,
      collectionOtp: m.hasOtp ? generateOTP() : undefined,
    }));

    const cluster = await FoodCluster.create({
      title: config.title,
      creator: users[config.creatorIndex]._id,
      restaurant: restaurants[config.restaurantIndex].name,
      restaurantAddress: restaurants[config.restaurantIndex].address,
      minimumBasket: config.minimumBasket,
      currentTotal: config.currentTotal,
      maxMembers: config.maxMembers,
      deliveryLocation: {
        type: 'Point',
        coordinates: [locations[config.locationIndex].lng, locations[config.locationIndex].lat],
        address: locations[config.locationIndex].address,
      },
      deliveryTime: new Date(Date.now() + config.hoursFromNow * 60 * 60 * 1000),
      status: config.status,
      notes: config.notes,
      members: memberData,
    });
    clusters.push(cluster);
    console.log(`Created food cluster: ${cluster.title}`);
    return cluster;
  };

  // 1. Open - needs more members
  await createCluster({
    title: 'Lunch at Dominos',
    creatorIndex: 0, restaurantIndex: 0, locationIndex: 0,
    minimumBasket: 500, currentTotal: 150, maxMembers: 5, hoursFromNow: 2,
    status: 'open', notes: 'Meeting at Thapar Gate for lunch!',
    members: [{ userIndex: 0, amount: 150, items: foodItems[0], hoursAgo: 0 }],
  });

  // 2. Open with multiple members
  await createCluster({
    title: 'McDonalds Group Order',
    creatorIndex: 1, restaurantIndex: 1, locationIndex: 1,
    minimumBasket: 400, currentTotal: 280, maxMembers: 6, hoursFromNow: 3,
    status: 'open', notes: 'Budget-friendly lunch at Mall Road!',
    members: [
      { userIndex: 1, amount: 180, items: foodItems[1], hoursAgo: 0 },
      { userIndex: 2, amount: 100, items: '1x McAloo Tikki, 1x Medium Fries', hoursAgo: 0.5 },
    ],
  });

  // 3. Open - CCD coffee run
  await createCluster({
    title: 'CCD Coffee Break',
    creatorIndex: 2, restaurantIndex: 13, locationIndex: 0,
    minimumBasket: 600, currentTotal: 350, maxMembers: 8, hoursFromNow: 1,
    status: 'open', notes: 'Afternoon coffee at Thapar Gate!',
    members: [
      { userIndex: 2, amount: 200, items: foodItems[8], hoursAgo: 1 },
      { userIndex: 4, amount: 150, items: '1x Cappuccino, 1x Chocolate Truffle', hoursAgo: 0.5 },
    ],
  });

  // 4. Open - Haveli
  await createCluster({
    title: 'Haveli Dinner Group',
    creatorIndex: 3, restaurantIndex: 9, locationIndex: 2,
    minimumBasket: 800, currentTotal: 320, maxMembers: 10, hoursFromNow: 4,
    status: 'open', notes: 'Punjabi dinner at Sheranwala Gate!',
    members: [{ userIndex: 3, amount: 320, items: foodItems[7], hoursAgo: 0 }],
  });

  // 5. Open - Giani Di Hatti
  await createCluster({
    title: 'Giani Kulcha Order',
    creatorIndex: 4, restaurantIndex: 8, locationIndex: 3,
    minimumBasket: 400, currentTotal: 200, maxMembers: 5, hoursFromNow: 2,
    status: 'open', notes: 'Famous Amritsari Kulche at Fountain Chowk!',
    members: [
      { userIndex: 4, amount: 120, items: foodItems[10], hoursAgo: 0 },
      { userIndex: 0, amount: 80, items: '1x Kulcha, 1x Chole', hoursAgo: 0.25 },
    ],
  });

  // 6. Filled - KFC
  await createCluster({
    title: 'KFC Friday Feast',
    creatorIndex: 2, restaurantIndex: 4, locationIndex: 8,
    minimumBasket: 600, currentTotal: 650, maxMembers: 4, hoursFromNow: 1,
    status: 'filled', notes: 'Friday chicken at Urban Estate!',
    members: [
      { userIndex: 2, amount: 300, items: foodItems[4], hoursAgo: 2 },
      { userIndex: 0, amount: 200, items: '1x Zinger Burger Meal', hoursAgo: 1 },
      { userIndex: 3, amount: 150, items: '5pc Hot Wings, 1x Pepsi', hoursAgo: 0.5 },
    ],
  });

  // 7. Filled - Baba Chicken
  await createCluster({
    title: 'Baba Chicken Party',
    creatorIndex: 0, restaurantIndex: 7, locationIndex: 14,
    minimumBasket: 800, currentTotal: 850, maxMembers: 4, hoursFromNow: 1.5,
    status: 'filled', notes: 'Famous Baba Chicken at Tripuri!',
    members: [
      { userIndex: 0, amount: 400, items: foodItems[11], hoursAgo: 3 },
      { userIndex: 1, amount: 250, items: '1x Tandoori Chicken Full', hoursAgo: 2 },
      { userIndex: 4, amount: 200, items: '1x Butter Chicken, 2x Naan', hoursAgo: 1 },
    ],
  });

  // 8. Filled - Baskin Robbins
  await createCluster({
    title: 'Baskin Robbins Dessert',
    creatorIndex: 1, restaurantIndex: 10, locationIndex: 6,
    minimumBasket: 500, currentTotal: 520, maxMembers: 5, hoursFromNow: 0.5,
    status: 'filled', notes: 'Ice cream at Leela Bhawan!',
    members: [
      { userIndex: 1, amount: 220, items: foodItems[13], hoursAgo: 1.5 },
      { userIndex: 3, amount: 150, items: '1x Chocolate Sundae', hoursAgo: 1 },
      { userIndex: 2, amount: 150, items: '1x Waffle Cone', hoursAgo: 0.5 },
    ],
  });

  // 9. Ordered - Sagar Ratna
  await createCluster({
    title: 'Sagar Ratna South Indian',
    creatorIndex: 3, restaurantIndex: 6, locationIndex: 7,
    minimumBasket: 500, currentTotal: 520, maxMembers: 5, hoursFromNow: 0.5,
    status: 'ordered', notes: 'South Indian at Mall Road',
    members: [
      { userIndex: 3, amount: 220, items: '2x Masala Dosa, 1x Filter Coffee', hoursAgo: 3 },
      { userIndex: 4, amount: 300, items: '1x Thali, 1x Rasam', hoursAgo: 2 },
    ],
  });

  // 10. Ordered - Subway
  await createCluster({
    title: 'Subway Healthy Lunch',
    creatorIndex: 4, restaurantIndex: 2, locationIndex: 3,
    minimumBasket: 450, currentTotal: 480, maxMembers: 6, hoursFromNow: 0.25,
    status: 'ordered', notes: 'Healthy subs at Fountain Chowk!',
    members: [
      { userIndex: 4, amount: 180, items: foodItems[2], hoursAgo: 2 },
      { userIndex: 2, amount: 150, items: '1x Paneer Tikka Sub', hoursAgo: 1.5 },
      { userIndex: 0, amount: 150, items: '1x Italian BMT, 1x Cookie', hoursAgo: 1 },
    ],
  });

  // 11. Ordered - Punjabi Dhaba
  await createCluster({
    title: 'Dhaba Style Lunch',
    creatorIndex: 2, restaurantIndex: 11, locationIndex: 5,
    minimumBasket: 400, currentTotal: 430, maxMembers: 4, hoursFromNow: 0.5,
    status: 'ordered', notes: 'Authentic dhaba food near Bus Stand!',
    members: [
      { userIndex: 2, amount: 200, items: '1x Dal Makhani, 2x Paratha', hoursAgo: 2 },
      { userIndex: 1, amount: 230, items: '1x Paneer Butter Masala, 2x Naan', hoursAgo: 1 },
    ],
  });

  // 12. Ready - Pizza Hut
  await createCluster({
    title: 'Pizza Hut Dinner',
    creatorIndex: 4, restaurantIndex: 5, locationIndex: 4,
    minimumBasket: 700, currentTotal: 750, maxMembers: 4, hoursFromNow: -0.5,
    status: 'ready', notes: 'Pizza night at Rajpura Road!',
    members: [
      { userIndex: 4, amount: 350, items: foodItems[5], hoursAgo: 4, hasCollected: true },
      { userIndex: 0, amount: 200, items: '1x Pepperoni Pizza Medium', hoursAgo: 3, hasOtp: true },
      { userIndex: 1, amount: 200, items: '1x Veggie Supreme, 1x Garlic Bread', hoursAgo: 2, hasOtp: true },
    ],
  });

  // 13. Ready - Ahuja Lassi
  await createCluster({
    title: 'Ahuja Lassi Break',
    creatorIndex: 0, restaurantIndex: 14, locationIndex: 1,
    minimumBasket: 350, currentTotal: 380, maxMembers: 6, hoursFromNow: -0.25,
    status: 'ready', notes: 'Famous lassi near Punjabi University!',
    members: [
      { userIndex: 0, amount: 150, items: foodItems[14], hoursAgo: 2, hasCollected: true },
      { userIndex: 3, amount: 130, items: '2x Special Lassi', hoursAgo: 1.5, hasOtp: true },
      { userIndex: 2, amount: 100, items: '1x Mango Lassi, 1x Paratha', hoursAgo: 1, hasOtp: true },
    ],
  });

  // 14. Collecting - Burger King
  await createCluster({
    title: 'Burger King Lunch',
    creatorIndex: 1, restaurantIndex: 3, locationIndex: 2,
    minimumBasket: 500, currentTotal: 550, maxMembers: 5, hoursFromNow: -1,
    status: 'collecting', notes: 'Burgers at Sheranwala Gate!',
    members: [
      { userIndex: 1, amount: 200, items: foodItems[3], hoursAgo: 4, hasCollected: true },
      { userIndex: 4, amount: 180, items: '1x Chicken Royale Meal', hoursAgo: 3, hasCollected: true },
      { userIndex: 2, amount: 170, items: '1x Veg Whopper, 1x Fries', hoursAgo: 2, hasOtp: true },
    ],
  });

  // 15. Completed - Pind Balluchi
  await createCluster({
    title: 'Pind Balluchi Breakfast',
    creatorIndex: 3, restaurantIndex: 12, locationIndex: 8,
    minimumBasket: 400, currentTotal: 450, maxMembers: 4, hoursFromNow: -3,
    status: 'completed', notes: 'Morning parathas at Urban Estate!',
    members: [
      { userIndex: 3, amount: 200, items: '2x Aloo Paratha, 1x Lassi', hoursAgo: 6, hasCollected: true },
      { userIndex: 0, amount: 150, items: '1x Paneer Paratha, 1x Chai', hoursAgo: 5, hasCollected: true },
      { userIndex: 4, amount: 100, items: '2x Kulcha, 1x Chole', hoursAgo: 5, hasCollected: true },
    ],
  });

  return clusters;
}

async function createRideClusters(users: any[]) {
  console.log('Creating ride clusters...');

  const clusters = [];

  // Helper to create a ride cluster
  const createRide = async (config: {
    title: string;
    creatorIndex: number;
    startLocationIndex: number;
    endLocation: { lat: number; lng: number; address: string };
    seatsRequired: number;
    seatsAvailable: number;
    totalFare: number;
    hoursFromNow: number;
    vehicleType: string;
    femaleOnly: boolean;
    status: string;
    notes: string;
    members: { userIndex: number; pickupLocation: { lat: number; lng: number; address: string }; hoursAgo: number }[];
  }) => {
    const memberData = config.members.map((m) => ({
      user: users[m.userIndex]._id,
      pickupPoint: {
        type: 'Point',
        coordinates: [m.pickupLocation.lng, m.pickupLocation.lat],
        address: m.pickupLocation.address,
      },
      joinedAt: new Date(Date.now() - m.hoursAgo * 60 * 60 * 1000),
    }));

    const ride = await RideCluster.create({
      title: config.title,
      creator: users[config.creatorIndex]._id,
      startPoint: {
        type: 'Point',
        coordinates: [locations[config.startLocationIndex].lng, locations[config.startLocationIndex].lat],
        address: locations[config.startLocationIndex].address,
      },
      endPoint: {
        type: 'Point',
        coordinates: [config.endLocation.lng, config.endLocation.lat],
        address: config.endLocation.address,
      },
      stops: [],
      members: memberData,
      seatsRequired: config.seatsRequired,
      seatsAvailable: config.seatsAvailable,
      totalFare: config.totalFare,
      farePerPerson: Math.round(config.totalFare / config.seatsRequired),
      departureTime: new Date(Date.now() + config.hoursFromNow * 60 * 60 * 1000),
      vehicleType: config.vehicleType,
      femaleOnly: config.femaleOnly,
      status: config.status,
      notes: config.notes,
    });
    clusters.push(ride);
    console.log(`Created ride cluster: ${ride.title}`);
    return ride;
  };

  // 1. Open - Patiala to Chandigarh
  await createRide({
    title: 'Patiala to Chandigarh',
    creatorIndex: 0, startLocationIndex: 0,
    endLocation: locations[11],
    seatsRequired: 4, seatsAvailable: 3, totalFare: 800, hoursFromNow: 2,
    vehicleType: 'cab', femaleOnly: false, status: 'open',
    notes: 'Morning trip to Chandigarh via NH-7',
    members: [{ userIndex: 0, pickupLocation: locations[0], hoursAgo: 0 }],
  });

  // 2. Open - Female only to Zirakpur
  await createRide({
    title: 'Ladies Ride to Zirakpur',
    creatorIndex: 1, startLocationIndex: 3,
    endLocation: locations[12],
    seatsRequired: 3, seatsAvailable: 1, totalFare: 600, hoursFromNow: 3,
    vehicleType: 'cab', femaleOnly: true, status: 'open',
    notes: 'Female only ride to Zirakpur Mall',
    members: [
      { userIndex: 1, pickupLocation: locations[3], hoursAgo: 1 },
      { userIndex: 3, pickupLocation: { lat: 30.3250, lng: 76.3900, address: 'Near Leela Bhawan, Patiala' }, hoursAgo: 0.5 },
    ],
  });

  // 3. Open - Ludhiana route
  await createRide({
    title: 'Patiala to Ludhiana',
    creatorIndex: 2, startLocationIndex: 5,
    endLocation: locations[10],
    seatsRequired: 4, seatsAvailable: 2, totalFare: 1000, hoursFromNow: 1.5,
    vehicleType: 'cab', femaleOnly: false, status: 'open',
    notes: 'Going to Ludhiana for shopping!',
    members: [
      { userIndex: 2, pickupLocation: locations[5], hoursAgo: 0.5 },
      { userIndex: 4, pickupLocation: { lat: 30.3400, lng: 76.3800, address: 'Near Bus Stand' }, hoursAgo: 0.25 },
    ],
  });

  // 4. Open - Auto ride
  await createRide({
    title: 'Auto to Mall Road',
    creatorIndex: 3, startLocationIndex: 0,
    endLocation: locations[7],
    seatsRequired: 3, seatsAvailable: 2, totalFare: 80, hoursFromNow: 0.5,
    vehicleType: 'auto', femaleOnly: false, status: 'open',
    notes: 'Budget auto to Mall Road',
    members: [{ userIndex: 3, pickupLocation: locations[0], hoursAgo: 0 }],
  });

  // 5. Open - Rajpura route
  await createRide({
    title: 'Patiala to Rajpura',
    creatorIndex: 4, startLocationIndex: 8,
    endLocation: locations[13],
    seatsRequired: 4, seatsAvailable: 3, totalFare: 300, hoursFromNow: 2.5,
    vehicleType: 'cab', femaleOnly: false, status: 'open',
    notes: 'Quick ride to Rajpura',
    members: [{ userIndex: 4, pickupLocation: locations[8], hoursAgo: 0 }],
  });

  // 6. Filled - Chandigarh Airport
  await createRide({
    title: 'Airport Express Chandigarh',
    creatorIndex: 2, startLocationIndex: 3,
    endLocation: { lat: 30.6735, lng: 76.7885, address: 'Chandigarh International Airport' },
    seatsRequired: 2, seatsAvailable: 0, totalFare: 1200, hoursFromNow: 4,
    vehicleType: 'cab', femaleOnly: false, status: 'filled',
    notes: 'Airport drop via Zirakpur. Punctual!',
    members: [
      { userIndex: 2, pickupLocation: locations[3], hoursAgo: 2 },
      { userIndex: 4, pickupLocation: { lat: 30.3300, lng: 76.3900, address: 'Fountain Chowk, Patiala' }, hoursAgo: 1 },
    ],
  });

  // 7. Filled - College trip
  await createRide({
    title: 'Thapar to Punjabi Uni',
    creatorIndex: 0, startLocationIndex: 0,
    endLocation: locations[1],
    seatsRequired: 4, seatsAvailable: 0, totalFare: 200, hoursFromNow: 1,
    vehicleType: 'cab', femaleOnly: false, status: 'filled',
    notes: 'College friends meetup!',
    members: [
      { userIndex: 0, pickupLocation: locations[0], hoursAgo: 2 },
      { userIndex: 1, pickupLocation: { lat: 30.3350, lng: 76.3880, address: 'Thapar C Gate' }, hoursAgo: 1.5 },
      { userIndex: 2, pickupLocation: { lat: 30.3380, lng: 76.3850, address: 'Near J Block' }, hoursAgo: 1 },
      { userIndex: 3, pickupLocation: locations[6], hoursAgo: 0.5 },
    ],
  });

  // 8. Filled - Late night
  await createRide({
    title: 'Late Night Safe Ride',
    creatorIndex: 1, startLocationIndex: 7,
    endLocation: locations[8],
    seatsRequired: 3, seatsAvailable: 0, totalFare: 200, hoursFromNow: 0.5,
    vehicleType: 'cab', femaleOnly: true, status: 'filled',
    notes: 'Safe late night ride - women only',
    members: [
      { userIndex: 1, pickupLocation: locations[7], hoursAgo: 1 },
      { userIndex: 3, pickupLocation: { lat: 30.3320, lng: 76.4050, address: 'Near Mall Road' }, hoursAgo: 0.5 },
    ],
  });

  // 9. In Progress - Auto to Bus Stand
  await createRide({
    title: 'Auto to Bus Stand',
    creatorIndex: 3, startLocationIndex: 2,
    endLocation: locations[5],
    seatsRequired: 3, seatsAvailable: 0, totalFare: 60, hoursFromNow: -0.5,
    vehicleType: 'auto', femaleOnly: false, status: 'in_progress',
    notes: 'Quick auto to catch bus',
    members: [
      { userIndex: 3, pickupLocation: locations[2], hoursAgo: 3 },
      { userIndex: 0, pickupLocation: { lat: 30.3360, lng: 76.4000, address: 'Near Sheranwala Gate' }, hoursAgo: 2 },
      { userIndex: 1, pickupLocation: { lat: 30.3340, lng: 76.3980, address: 'Gurdwara Road' }, hoursAgo: 1 },
    ],
  });

  // 10. In Progress - Chandigarh return
  await createRide({
    title: 'Chandigarh to Patiala',
    creatorIndex: 4, startLocationIndex: 11,
    endLocation: locations[0],
    seatsRequired: 4, seatsAvailable: 0, totalFare: 900, hoursFromNow: -0.25,
    vehicleType: 'cab', femaleOnly: false, status: 'in_progress',
    notes: 'Evening return from Chandigarh',
    members: [
      { userIndex: 4, pickupLocation: locations[11], hoursAgo: 1 },
      { userIndex: 2, pickupLocation: { lat: 30.7400, lng: 76.7800, address: 'Sector 17, Chandigarh' }, hoursAgo: 0.75 },
      { userIndex: 0, pickupLocation: { lat: 30.7200, lng: 76.7600, address: 'Sector 22, Chandigarh' }, hoursAgo: 0.5 },
      { userIndex: 1, pickupLocation: { lat: 30.3800, lng: 76.7750, address: 'Zirakpur' }, hoursAgo: 0.25 },
    ],
  });

  // 11. In Progress - Tripuri to Thapar
  await createRide({
    title: 'Tripuri to Thapar',
    creatorIndex: 0, startLocationIndex: 14,
    endLocation: locations[0],
    seatsRequired: 3, seatsAvailable: 0, totalFare: 60, hoursFromNow: -0.1,
    vehicleType: 'auto', femaleOnly: false, status: 'in_progress',
    notes: 'Morning college commute',
    members: [
      { userIndex: 0, pickupLocation: locations[14], hoursAgo: 0.5 },
      { userIndex: 3, pickupLocation: { lat: 30.3580, lng: 76.3550, address: 'Near Tripuri Market' }, hoursAgo: 0.25 },
      { userIndex: 4, pickupLocation: { lat: 30.3550, lng: 76.3600, address: 'Tripuri Phase 2' }, hoursAgo: 0.1 },
    ],
  });

  // 12. Completed - Ludhiana carpool
  await createRide({
    title: 'Carpool from Ludhiana',
    creatorIndex: 4, startLocationIndex: 10,
    endLocation: locations[0],
    seatsRequired: 2, seatsAvailable: 0, totalFare: 800, hoursFromNow: -6,
    vehicleType: 'carpool', femaleOnly: false, status: 'completed',
    notes: 'Carpool completed from Ludhiana!',
    members: [
      { userIndex: 4, pickupLocation: locations[10], hoursAgo: 8 },
      { userIndex: 2, pickupLocation: { lat: 30.8800, lng: 75.8700, address: 'Near Clock Tower, Ludhiana' }, hoursAgo: 7 },
    ],
  });

  // 13. Completed - Weekend outing
  await createRide({
    title: 'Weekend to Elante Mall',
    creatorIndex: 1, startLocationIndex: 0,
    endLocation: { lat: 30.7056, lng: 76.8010, address: 'Elante Mall, Chandigarh' },
    seatsRequired: 4, seatsAvailable: 0, totalFare: 1000, hoursFromNow: -4,
    vehicleType: 'cab', femaleOnly: false, status: 'completed',
    notes: 'Weekend shopping done!',
    members: [
      { userIndex: 1, pickupLocation: locations[0], hoursAgo: 6 },
      { userIndex: 0, pickupLocation: locations[3], hoursAgo: 5.5 },
      { userIndex: 3, pickupLocation: { lat: 30.3200, lng: 76.3900, address: 'Model Town, Patiala' }, hoursAgo: 5 },
      { userIndex: 4, pickupLocation: locations[8], hoursAgo: 4.5 },
    ],
  });

  // 14. Completed - College commute
  await createRide({
    title: 'Morning to Thapar',
    creatorIndex: 2, startLocationIndex: 9,
    endLocation: locations[0],
    seatsRequired: 3, seatsAvailable: 0, totalFare: 150, hoursFromNow: -8,
    vehicleType: 'cab', femaleOnly: false, status: 'completed',
    notes: 'Morning college commute done',
    members: [
      { userIndex: 2, pickupLocation: locations[9], hoursAgo: 10 },
      { userIndex: 4, pickupLocation: { lat: 30.3180, lng: 76.3950, address: 'Near Model Town' }, hoursAgo: 9.5 },
      { userIndex: 0, pickupLocation: { lat: 30.3250, lng: 76.3800, address: 'Near Rajpura Road' }, hoursAgo: 9 },
    ],
  });

  // 15. Cancelled
  await createRide({
    title: 'Concert in Chandigarh',
    creatorIndex: 3, startLocationIndex: 0,
    endLocation: { lat: 30.7270, lng: 76.7712, address: 'Tagore Theatre, Chandigarh' },
    seatsRequired: 4, seatsAvailable: 2, totalFare: 900, hoursFromNow: 5,
    vehicleType: 'cab', femaleOnly: false, status: 'cancelled',
    notes: 'Concert cancelled - ride cancelled',
    members: [
      { userIndex: 3, pickupLocation: locations[0], hoursAgo: 24 },
      { userIndex: 1, pickupLocation: { lat: 30.3350, lng: 76.3900, address: 'Leela Bhawan' }, hoursAgo: 20 },
    ],
  });

  return clusters;
}

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await clearDatabase();
    const users = await createUsers();
    await createFoodClusters(users);
    await createRideClusters(users);

    console.log('\n========================================');
    console.log('Seed completed successfully!');
    console.log('========================================');
    console.log('\nTest accounts:');
    testUsers.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.email} / ${PASSWORD}`);
    });
    console.log('\nFood clusters created: 15');
    console.log('Ride clusters created: 15');
    console.log('========================================\n');

  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

seed();
