import * as fm from '../models/financeModel.js';

// Partners
export const createPartner = async (req, res) => res.json(await fm.createPartner(req.body));
export const getPartners = async (req, res) => res.json(await fm.getPartners(req.query));

// Orders
export const createSaleOrder = async (req, res) => {
  const order = await fm.createOrder('sale_orders', req.body);
  res.json(order);
};
export const createPurchaseOrder = async (req, res) => {
  const order = await fm.createOrder('purchase_orders', req.body);
  res.json(order);
};
export const getSaleOrders = async (req, res) => res.json(await fm.getOrders('sale_orders', req.query));
export const getPurchaseOrders = async (req, res) => res.json(await fm.getOrders('purchase_orders', req.query));

// Items
export const addSaleOrderItem = async (req, res) => {
  const item = await fm.addOrderItem('sale_order_items', req.body);
  await fm.updateOrderTotal('sale_orders', req.body.order_id);
  res.json(item);
};
export const addPurchaseOrderItem = async (req, res) => {
  const item = await fm.addOrderItem('purchase_order_items', req.body);
  await fm.updateOrderTotal('purchase_orders', req.body.order_id);
  res.json(item);
};
export const getSaleOrderItems = async (req, res) => res.json(await fm.getOrderItems('sale_order_items', req.params.orderId));
export const getPurchaseOrderItems = async (req, res) => res.json(await fm.getOrderItems('purchase_order_items', req.params.orderId));

// Payments
export const addPayment = async (req, res) => res.json(await fm.addPayment(req.body));
export const getPayments = async (req, res) => res.json(await fm.getPayments(req.query));
export const getOrderPaid = async (req, res) => {
  const paid = await fm.getOrderPaid(req.query.order_type, req.query.order_id);
  res.json({ paid });
};