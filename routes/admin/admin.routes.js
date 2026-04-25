const express = require('express');
const router = express.Router();

const clientController = require('../../controllers/admin/client.controller');
const accessController = require('../../controllers/admin/access.controller');
const ledgerController = require('../../controllers/admin/ledger.controller');
const adminAuthController = require('../../controllers/admin/adminAuth.controller');
const streamingMapController = require('../../controllers/admin/streamingMap.controller');
const adminAuth = require('../../middlewares/adminAuth.middleware');
const { handleGetSportRadarToken, handleManualTokenUpdate, handleSportRadarRefresh } = require('../../controllers/sportradar/sportRadarAuth.controller');


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

// =======================
// STREAMING MAPPING ROUTES
// =======================
const { getUnmappedEvents, mergeEvents, listMappings, unlinkMapping, getStreamingStats, forceSync, getMappingDetails } = require("../../controllers/admin/streamingMap.controller");

router.get("/streaming/unmapped", getUnmappedEvents);
router.post("/streaming/merge", mergeEvents);
router.get("/streaming/mappings", listMappings);
router.delete("/streaming/unlink/:id", unlinkMapping);
router.get("/streaming/stats", getStreamingStats);
router.post("/streaming/sync", forceSync);
router.get('/streaming/details/:bfId/:dId', getMappingDetails);

// =======================
// SPORTRADAR CONFIG ROUTES
// =======================
router.get('/sportradar/token', handleGetSportRadarToken);
router.post('/sportradar/update', handleManualTokenUpdate);
router.post('/sportradar/refresh', handleSportRadarRefresh);

module.exports = router;
