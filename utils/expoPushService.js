const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
let expo = new Expo();

/**
 * Check if token is a valid Expo push token
 * @param {string} token - Push token to validate
 * @returns {boolean} - True if valid Expo token
 */
const isExpoPushToken = (token) => {
  return Expo.isExpoPushToken(token);
};

/**
 * Send push notification to single Expo device
 * @param {string} expoPushToken - Expo push token
 * @param {string} title - Notification title
 * @param {string} body - Notification message
 * @param {object} data - Additional data payload
 * @returns {Promise<object>} - Expo response
 */
exports.sendExpoNotification = async (expoPushToken, title, body, data = {}) => {
  if (!expoPushToken) {
    console.warn('Expo push token not provided');
    return { success: false, error: 'Expo push token required' };
  }

  // Validate token
  if (!isExpoPushToken(expoPushToken)) {
    console.warn('Invalid Expo push token format:', expoPushToken);
    return { 
      success: false, 
      error: 'Invalid Expo push token format',
      shouldRemoveToken: true 
    };
  }

  // Create message
  const messages = [{
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: {
      ...data,
      title: title,
      body: body
    },
    priority: 'high',
    channelId: 'default'
  }];

  try {
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];
    
    // Send notifications in chunks
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending Expo notification chunk:', error);
      }
    }

    // Check ticket results
    if (tickets.length > 0) {
      const ticket = tickets[0];
      
      // Check if there was an error
      if (ticket.status === 'error') {
        console.error('Expo notification error:', ticket.message);
        
        // Check if token is invalid
        if (ticket.details && ticket.details.error === 'DeviceNotRegistered') {
          return {
            success: false,
            error: 'Device not registered',
            shouldRemoveToken: true
          };
        }
        
        return {
          success: false,
          error: ticket.message || 'Unknown error'
        };
      }
      
      // Success
      return {
        success: true,
        ticketId: ticket.id
      };
    }
    
    return { success: false, error: 'No tickets received' };
  } catch (error) {
    console.error('Error sending Expo notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notification to multiple Expo devices
 * @param {Array<string>} expoPushTokens - Array of Expo push tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification message
 * @param {object} data - Additional data payload
 * @returns {Promise<object>} - Expo response with results
 */
exports.sendMulticastExpoNotification = async (expoPushTokens, title, body, data = {}) => {
  if (!expoPushTokens || expoPushTokens.length === 0) {
    console.warn('No Expo push tokens provided');
    return { success: false, error: 'Expo push tokens required' };
  }

  // Filter valid tokens
  const validTokens = expoPushTokens.filter(token => isExpoPushToken(token));
  const invalidTokens = expoPushTokens.filter(token => !isExpoPushToken(token));

  if (validTokens.length === 0) {
    return {
      success: false,
      error: 'No valid Expo push tokens',
      invalidTokens: invalidTokens
    };
  }

  // Create messages
  const messages = validTokens.map(token => ({
    to: token,
    sound: 'default',
    title: title,
    body: body,
    data: {
      ...data,
      title: title,
      body: body
    },
    priority: 'high',
    channelId: 'default'
  }));

  try {
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];
    
    // Send notifications in chunks
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending Expo notification chunk:', error);
      }
    }

    // Process results
    let successCount = 0;
    let failureCount = 0;
    const tokensToRemove = [];

    tickets.forEach((ticket, index) => {
      if (ticket.status === 'ok') {
        successCount++;
      } else if (ticket.status === 'error') {
        failureCount++;
        
        // Check if device is not registered
        if (ticket.details && ticket.details.error === 'DeviceNotRegistered') {
          tokensToRemove.push(validTokens[index]);
        }
      }
    });

    return {
      success: successCount > 0,
      successCount: successCount,
      failureCount: failureCount + invalidTokens.length,
      invalidTokens: [...tokensToRemove, ...invalidTokens]
    };
  } catch (error) {
    console.error('Error sending multicast Expo notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if token is Expo push token
 */
exports.isExpoPushToken = isExpoPushToken;

