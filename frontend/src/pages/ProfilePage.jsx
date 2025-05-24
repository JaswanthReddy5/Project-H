import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { 
  FaSignOutAlt, 
  FaEdit, 
  FaCog, 
  FaBell, 
  FaShieldAlt, 
  FaQuestionCircle, 
  FaChevronRight,
  FaCamera,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaGraduationCap,
  FaCheck,
  FaTimes,
  FaUtensils,
  FaShoppingBag,
  FaTruck,
  FaClock,
  FaWallet,
  FaIdCard,
  FaHistory,
  FaHeart
} from "react-icons/fa";


export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    studentId: user?.studentId || '',
    year: user?.year || '',
    major: user?.major || '',
    dormitory: user?.dormitory || '',
    bio: user?.bio || ''
  });

  const handleLogout = () => {
    logout();
    // You can add navigation logic here if needed
    // For example: window.location.href = '/login';
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    console.log('Saving user data:', editedUser);
    setIsEditing(false);
    // API call to update user profile would go here
  };

  const handleCancel = () => {
    setEditedUser({
      username: user?.username || '',
      email: user?.email || '',
      phone: user?.phone || '',
      studentId: user?.studentId || '',
      year: user?.year || '',
      major: user?.major || '',
      dormitory: user?.dormitory || '',
      bio: user?.bio || ''
    });
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const menuItems = [
    { icon: FaUtensils, label: 'My Food Orders', action: () => console.log('Navigate to food orders'), color: 'text-orange-400' },
    { icon: FaShoppingBag, label: 'My Item Requests', action: () => console.log('Navigate to item requests'), color: 'text-purple-400' },
    { icon: FaTruck, label: 'Delivery History', action: () => console.log('Navigate to delivery history'), color: 'text-green-400' },
    { icon: FaWallet, label: 'Earnings & Payments', action: () => console.log('Navigate to earnings'), color: 'text-yellow-400' },
    { icon: FaBell, label: 'Notifications', action: () => console.log('Navigate to notifications'), color: 'text-blue-400' },
    { icon: FaShieldAlt, label: 'Privacy & Security', action: () => console.log('Navigate to privacy'), color: 'text-cyan-400' },
    { icon: FaCog, label: 'Settings', action: () => console.log('Navigate to settings'), color: 'text-gray-400' },
    { icon: FaQuestionCircle, label: 'Help & Support', action: () => console.log('Navigate to help'), color: 'text-indigo-400' },
  ];

  return (
    <div className="p-6 text-white min-h-screen bg-gradient-to-b from-black to-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-cyan-400">Profile</h1>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="bg-cyan-400 text-black px-4 py-2 rounded-lg hover:bg-cyan-300 transition-colors flex items-center space-x-2"
          >
            <FaEdit />
            <span>Edit</span>
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-xl mb-6 border border-cyan-400/20">
        {/* Profile Picture & Basic Info */}
        <div className="flex items-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-black text-3xl font-bold mr-4 shadow-lg">
              {user?.username?.[0]?.toUpperCase() || user?.name?.[0] || 'U'}
            </div>
            <button className="absolute -bottom-1 -right-1 bg-cyan-400 text-black p-2 rounded-full hover:bg-cyan-300 transition-colors shadow-lg">
              <FaCamera className="text-xs" />
            </button>
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editedUser.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="text-xl font-bold bg-gray-700 text-cyan-400 px-3 py-2 rounded-lg w-full mb-2"
                placeholder="Your name"
              />
            ) : (
              <h2 className="text-xl font-bold text-cyan-400">
                {user?.username || user?.name || 'Student'}
              </h2>
            )}
            <p className="text-gray-400 text-sm">University Student</p>
          </div>
        </div>

        {/* Student Information */}
        <div className="space-y-4">
          {/* Bio */}
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <FaUser className="text-cyan-400 mr-2" />
              <span className="text-sm font-semibold text-cyan-400">Bio</span>
            </div>
            {isEditing ? (
              <textarea
                value={editedUser.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="w-full bg-gray-600 text-white p-2 rounded resize-none"
                rows="3"
                placeholder="Tell other students about yourself..."
              />
            ) : (
              <p className="text-gray-300 text-sm">
                {editedUser.bio || 'No bio added yet. Let other students know about yourself!'}
              </p>
            )}
          </div>

          {/* Contact Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FaEnvelope className="text-cyan-400 mr-2" />
                <span className="text-sm font-semibold text-cyan-400">Email</span>
              </div>
              {isEditing ? (
                <input
                  type="email"
                  value={editedUser.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full bg-gray-600 text-white p-2 rounded"
                  placeholder="your.email@university.edu"
                />
              ) : (
                <p className="text-gray-300 text-sm">{editedUser.email || 'No email provided'}</p>
              )}
            </div>

            {/* Phone */}
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FaPhone className="text-cyan-400 mr-2" />
                <span className="text-sm font-semibold text-cyan-400">Phone</span>
              </div>
              {isEditing ? (
                <input
                  type="tel"
                  value={editedUser.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full bg-gray-600 text-white p-2 rounded"
                  placeholder="+1 (555) 123-4567"
                />
              ) : (
                <p className="text-gray-300 text-sm">{editedUser.phone || 'No phone number provided'}</p>
              )}
            </div>

            {/* Student ID */}
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FaIdCard className="text-cyan-400 mr-2" />
                <span className="text-sm font-semibold text-cyan-400">Student ID</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedUser.studentId}
                  onChange={(e) => handleInputChange('studentId', e.target.value)}
                  className="w-full bg-gray-600 text-white p-2 rounded"
                  placeholder="Student ID"
                />
              ) : (
                <p className="text-gray-300 text-sm">{editedUser.studentId || 'No student ID provided'}</p>
              )}
            </div>

            {/* Year & Major */}
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FaGraduationCap className="text-cyan-400 mr-2" />
                <span className="text-sm font-semibold text-cyan-400">Academic Info</span>
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editedUser.year}
                    onChange={(e) => handleInputChange('year', e.target.value)}
                    className="w-full bg-gray-600 text-white p-2 rounded"
                    placeholder="Year (e.g., 2nd Year)"
                  />
                  <input
                    type="text"
                    value={editedUser.major}
                    onChange={(e) => handleInputChange('major', e.target.value)}
                    className="w-full bg-gray-600 text-white p-2 rounded"
                    placeholder="Major"
                  />
                </div>
              ) : (
                <div className="text-gray-300 text-sm">
                  <p>{editedUser.year || 'Year not specified'}</p>
                  <p>{editedUser.major || 'Major not specified'}</p>
                </div>
              )}
            </div>

            {/* Dormitory */}
            <div className="bg-gray-700/50 p-4 rounded-lg md:col-span-2">
              <div className="flex items-center mb-2">
                <FaMapMarkerAlt className="text-cyan-400 mr-2" />
                <span className="text-sm font-semibold text-cyan-400">Dormitory/Location</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedUser.dormitory}
                  onChange={(e) => handleInputChange('dormitory', e.target.value)}
                  className="w-full bg-gray-600 text-white p-2 rounded"
                  placeholder="Dorm name and room number"
                />
              ) : (
                <p className="text-gray-300 text-sm">{editedUser.dormitory || 'No dormitory/location provided'}</p>
              )}
            </div>
          </div>

          {/* Activity Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-orange-400/10 p-4 rounded-lg text-center border border-orange-400/20">
              <FaUtensils className="text-orange-400 text-xl mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-400">{user?.foodOrdersCount || 0}</div>
              <div className="text-xs text-gray-400">Food Orders</div>
            </div>
            <div className="bg-purple-400/10 p-4 rounded-lg text-center border border-purple-400/20">
              <FaShoppingBag className="text-purple-400 text-xl mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-400">{user?.itemRequestsCount || 0}</div>
              <div className="text-xs text-gray-400">Item Requests</div>
            </div>
            <div className="bg-green-400/10 p-4 rounded-lg text-center border border-green-400/20">
              <FaTruck className="text-green-400 text-xl mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-400">{user?.deliveriesCount || 0}</div>
              <div className="text-xs text-gray-400">Deliveries Made</div>
            </div>
            <div className="bg-yellow-400/10 p-4 rounded-lg text-center border border-yellow-400/20">
              <FaHeart className="text-yellow-400 text-xl mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-400">{user?.helpScore || '5.0'}</div>
              <div className="text-xs text-gray-400">Help Rating</div>
            </div>
          </div>
        </div>

        {/* Edit Actions */}
        {isEditing && (
          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleSave}
              className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-green-600 transition-colors"
            >
              <FaCheck />
              <span>Save Changes</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-600 transition-colors"
            >
              <FaTimes />
              <span>Cancel</span>
            </button>
          </div>
        )}
      </div>

      {/* Menu Items */}
      {!isEditing && (
        <div className="space-y-3 mb-6">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="w-full bg-gray-800/50 p-4 rounded-xl flex items-center justify-between hover:bg-gray-700/50 transition-colors border border-gray-700/50"
            >
              <div className="flex items-center space-x-4">
                <item.icon className={`text-xl ${item.color}`} />
                <span className="text-white font-medium">{item.label}</span>
              </div>
              <FaChevronRight className="text-gray-400" />
            </button>
          ))}
        </div>
      )}

      {/* Logout Button */}
      {!isEditing && (
        <button
          onClick={handleLogout}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-4 rounded-xl flex items-center justify-center space-x-2 hover:from-red-600 hover:to-red-700 transition-all shadow-lg"
        >
          <FaSignOutAlt />
          <span className="font-semibold">Logout</span>
        </button>
      )}
    </div>
  );
};