 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
 
const JWT_SECRET = process.env.JWT_SECRET || 'b2y';
 
//Importing Models
const { TenantModel, AddressModel } = require('../ConnectionDB/Connect');
 
 
 
 
// Tenant Signup
const tenantSignup = async (req, res) => {
    try {
        const {
            CompanyName,
            CompanyCode,
            Email,
            Password,
            PhoneNumber,
            GSTno,
            AddressLine,
            CityID,
            StateID,
            CountryID,
            Pincode
        } = req.body;
 
        // Check if tenant already exists with the same email or phone number
        const existingTenant = await TenantModel.findOne({ where: { Email } });
        if (existingTenant) {
            return res.status(400).json({ message: 'Tenant already exists with this email' });
        }
 
        const existingPhoneNumber = await TenantModel.findOne({ where: { PhoneNumber } });
        if (existingPhoneNumber) {
            return res.status(400).json({ message: 'Tenant already exists with this phone number' });
        }
 
        // Create new tenant
        const newTenant = await TenantModel.create({
            CompanyName,
            CompanyCode,
            Email,
            Password,
            PhoneNumber,
            GSTno,
            AddressLine,
            CityID,
            StateID,
            CountryID,
            Pincode,
            CreatedBy: Email // Set the creator as the tenant's email
        });
 
        res.status(201).json({
            status: 'SUCCESS',
            message: 'Tenant registered successfully',
            tenant: newTenant
        });
    } catch (error) {
        console.error('Error during tenant signup:', error);
        res.status(500).json({ status: 'FAILURE', message: 'Error occurred while registering tenant' });
    }
};
 
 
 
// Tenant Login
const tenantlogin = async (req, res) => {
    try {
        const { Email, PhoneNumber, Password } = req.body;
 
        // Validate Email or PhoneNumber and Password are provided
        if (!Email && !PhoneNumber) {
            return res.status(400).json({ message: 'Email or PhoneNumber is required' });
        }
        if (!Password) {
            return res.status(400).json({ message: 'Password is required' });
        }
 
       // Find tenant by Email or PhoneNumber
        let tenant;
        if (Email) {
            tenant = await TenantModel.findOne({ where: { Email } });
        } else if (PhoneNumber) {
            tenant = await TenantModel.findOne({ where: { PhoneNumber } });
        }
       
 
        console.log('Retrieved Tenant:', tenant);
 
        if (Email !== tenant.Email || PhoneNumber !== tenant.PhoneNumber) {
            return res.status(400).json({ status: 'FAILURE', message: 'Email or PhoneNumber not found' });
        }
       
 
        // Compare passwords (plain text comparison)
        if (Password !== tenant.Password) {
            return res.status(400).json({ status: 'FAILURE', message: 'Invalid credentials' });
        }
 
        // Create JWT token
        const payload = { tenantId: tenant.TenantID };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
 
        res.status(200).json({
            status: 'SUCCESS',
            message: 'Tenant logged in successfully',
            token
        });
    } catch (error) {
        console.error('Error during tenant login:', error);
        res.status(500).json({
            status: 'FAILURE',
            message: 'Error occurred while logging in tenant'
        });
    }
};
 
module.exports = {tenantSignup,tenantlogin};
