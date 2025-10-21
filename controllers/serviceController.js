const Service = require('../models/Service');

// Create service request
exports.createServiceRequest = async (req,res) => {
  try {
    const { 
      vehicleCategory, serviceType, title, description, mobile, email, address,
      urgency, preferredDate, preferredTime, paymentMethod, estimatedPrice, notes
    } = req.body || {};
    
    const images = (req.files || []).map(f => `/uploads/${f.filename}`);
    
    const service = new Service({
      user: req.user._id,
      vehicleCategory, serviceType, title, description, mobile, email, address,
      urgency, preferredDate, preferredTime, paymentMethod, estimatedPrice, notes, images
    });
    
    await service.save();
    res.status(201).json({ 
      success: true, 
      data: service, 
      message: 'Service request created successfully' 
    });
  } catch(err){
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};

// Get all service requests (for clients)
exports.getServiceRequests = async (req,res) => {
  try {
    const { status, serviceType, vehicleCategory, urgency } = req.query;
    let filter = {};
    
    if(status) filter.status = status;
    if(serviceType) filter.serviceType = serviceType;
    if(vehicleCategory) filter.vehicleCategory = vehicleCategory;
    if(urgency) filter.urgency = urgency;
    
    const services = await Service.find(filter)
      .populate('user', 'name email phone')
      .populate('assignedTo', 'name email phone businessName')
      .sort({ createdAt: -1 });
      
    res.json({ 
      success: true, 
      data: services, 
      message: `Found ${services.length} service requests` 
    });
  } catch(err){
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};

// Get my service requests (for users)
exports.getMyServiceRequests = async (req,res) => {
  try {
    // Get all services since this is now a public endpoint
    const services = await Service.find({})
      .populate('user', 'name email phone')
      .populate('assignedTo', 'name email phone businessName')
      .sort({ createdAt: -1 });
      
    res.json({ 
      success: true, 
      data: services, 
      message: `Found ${services.length} service requests` 
    });
  } catch(err){
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};

// Get service request by ID
exports.getServiceRequestById = async (req,res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('user', 'name email phone address')
      .populate('assignedTo', 'name email phone businessName businessAddress');
      
    if(!service) return res.status(404).json({ 
      success: false, 
      data: null, 
      message: 'Service request not found' 
    });
    
    res.json({ 
      success: true, 
      data: service, 
      message: 'Service request found successfully' 
    });
  } catch(err){
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};

// Accept service request (for clients)
exports.acceptServiceRequest = async (req,res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if(!service) return res.status(404).json({ 
      success: false, 
      data: null, 
      message: 'Service request not found' 
    });
    
    if(service.status !== 'pending') return res.status(400).json({ 
      success: false, 
      data: null, 
      message: 'Service request is not available for acceptance' 
    });
    
    service.status = 'accepted';
    service.assignedTo = req.user._id;
    await service.save();
    
    res.json({ 
      success: true, 
      data: service, 
      message: 'Service request accepted successfully' 
    });
  } catch(err){
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};

// Update service status
exports.updateServiceStatus = async (req,res) => {
  try {
    const { status } = req.body;
    const service = await Service.findById(req.params.id);
    
    if(!service) return res.status(404).json({ 
      success: false, 
      data: null, 
      message: 'Service request not found' 
    });
    
    // Only assigned client or the user who created the request can update status
    if(service.assignedTo.toString() !== req.user._id.toString() && 
       service.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        data: null, 
        message: 'Not authorized to update this service request' 
      });
    }
    
    service.status = status;
    await service.save();
    
    res.json({ 
      success: true, 
      data: service, 
      message: 'Service status updated successfully' 
    });
  } catch(err){
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};

// Get service requests assigned to me (for clients)
exports.getAssignedServiceRequests = async (req,res) => {
  try {
    // Get all services since this is now a public endpoint
    const services = await Service.find({})
      .populate('user', 'name email phone address')
      .populate('assignedTo', 'name email phone businessName')
      .sort({ createdAt: -1 });
      
    res.json({ 
      success: true, 
      data: services, 
      message: `Found ${services.length} service requests` 
    });
  } catch(err){
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};
