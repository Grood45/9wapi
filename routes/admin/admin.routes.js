const express = require('express');
const router = express.Router();

const clientController = require('../../controllers/admin/client.controller');
const accessController = require('../../controllers/admin/access.controller');
const ledgerController = require('../../controllers/admin/ledger.controller');
const adminAuthController = require('../../controllers/admin/adminAuth.controller');
const adminAuth = require('../../middlewares/adminAuth.middleware');

// =======================
// AUTH ROUTES (PUBLIC)
// =======================
router.post('/login', adminAuthController.login);

// =======================
// PROTECTED ADMIN ROUTES
// =======================
router.use(adminAuth);

router.get('/verify-session', adminAuthController.verifySession);
router.post('/logout', adminAuthController.logout);
router.post('/change-password', adminAuthController.changePassword);

// =======================
// CLIENT ROUTES
// =======================
router.route('/clients')
    .get(clientController.getClients)
    .post(clientController.createClient);

router.route('/clients/:id')
    .get(clientController.getClient)
    .put(clientController.updateClient)
    .delete(clientController.deleteClient);

// =======================
// ACCESS CONFIG ROUTES
// =======================
router.route('/access')
    .get(accessController.getClientAccesses)
    .post(accessController.createAccess);

router.route('/access/client/:clientId')
    .get(accessController.getAccessByClient);

router.post('/access/sync/:clientId', accessController.syncClientAccess);

router.route('/access/:id')
    .put(accessController.updateAccess)
    .delete(accessController.deleteAccess);

// =======================
// LEDGER / BILLING ROUTES
// =======================
router.route('/ledgers')
    .get(ledgerController.getLedgers);

router.route('/ledgers/stats')
    .get(ledgerController.getDashboardStats);

router.route('/ledgers/upsert')
    .post(ledgerController.upsertLedger);

router.route('/ledgers/client/:clientId')
    .get(ledgerController.getClientLedger);

router.route('/ledgers/:id/transaction')
    .post(ledgerController.addTransaction);

module.exports = router;
