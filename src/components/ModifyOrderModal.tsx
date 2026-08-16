import { FormEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useMarket } from "../context/MarketContext";
import { modifyOrder } from "../services/tradingApi";
import type { OrderDto, ModifyOrderRequest } from "../types/trading";
import "./OrderEntryModal.scss";

interface ModifyOrderModalProps {
  open: boolean;
  order: OrderDto | null;
  onClose: () => void;
}

function ModifyOrderModal({ open, order, onClose }: ModifyOrderModalProps) {
  const { getTick, reloadTradingData, subscribe, unsubscribe } = useMarket();
  
  const symbol = order?.symbol || "";
  const exchange = order?.exchange || "";
  const instrumentType = order?.instrumentType || "";
  const orderSide = order?.transactionType || "BUY";
  
  const tick = getTick(symbol, exchange);

  const [orderType, setOrderType] = useState("LIMIT");
  const [quantity, setQuantity] = useState<string | number>(1);
  const [price, setPrice] = useState<string | number>(0);
  const [triggerPrice, setTriggerPrice] = useState<string | number>(0);
  const [stopLoss, setStopLoss] = useState<string | number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order) {
      setOrderType(order.orderType);
      setQuantity(order.quantity);
      setPrice(order.price);
      setTriggerPrice(order.triggerPrice);
      setStopLoss(order.stopLoss);
    }
  }, [order]);

  const handleNumericChange = (value: string, setter: (val: string | number) => void) => {
    const sanitized = value.replace(/[^0-9.]/g, "");
    const parts = sanitized.split(".");
    const finalValue = parts[0] + (parts.length > 1 ? "." + parts.slice(1).join("") : "");
    setter(finalValue);
  };

  useEffect(() => {
    if (open && symbol && exchange) {
      void subscribe(symbol, exchange, instrumentType);
    }
    return () => {
      if (open && symbol && exchange) {
        void unsubscribe(symbol, exchange, instrumentType);
      }
    };
  }, [open, symbol, exchange, instrumentType, subscribe, unsubscribe]);

  if (!open || !order) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!order) return;
    setLoading(true);
    const ltp = tick?.ltp ?? 0;
    const numPrice = orderType === "SL-M" ? 0 : Number(price);
    const numTrigger = (orderType === "SL" || orderType === "SL-M") ? Number(triggerPrice) : 0;
    const numTarget = 0; 
    const numSL = (orderType === "SL" || orderType === "SL-M") ? Number(stopLoss) : 0;

    if (orderType === "SL" || orderType === "SL-M") {
      if (numTrigger <= 0) {
        toast.error("Trigger price must be greater than 0");
        setLoading(false);
        return;
      }
      if (ltp > 0) {
        if (orderSide === "BUY" && numTrigger <= ltp) {
          toast.error(`For BUY ${orderType}, Trigger Price (${numTrigger}) must be greater than LTP (${ltp})`);
          setLoading(false);
          return;
        }
        if (orderSide === "SELL" && numTrigger >= ltp) {
          toast.error(`For SELL ${orderType}, Trigger Price (${numTrigger}) must be less than LTP (${ltp})`);
          setLoading(false);
          return;
        }
      }
    }

    if (orderType === "SL") {
      if (orderSide === "BUY" && numPrice < numTrigger) {
        toast.error("For BUY SL, Limit Price must be greater than or equal to Trigger Price");
        setLoading(false);
        return;
      }
      if (orderSide === "SELL" && numPrice > numTrigger) {
        toast.error("For SELL SL, Limit Price must be less than or equal to Trigger Price");
        setLoading(false);
        return;
      }
    }

    try {
      const payload: ModifyOrderRequest = {
        orderType,
        quantity: Number(quantity),
        price: orderType === "MARKET" ? ltp : orderType === "SL-M" ? 0 : numPrice,
        triggerPrice: numTrigger,
        stopLoss: numSL,
        target: numTarget,
        trailStopLoss: 0,
      };
      await modifyOrder(order.id, payload);
      toast.success(`${orderSide} order modified for ${symbol}`);
      await reloadTradingData();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Modify failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="order-modal-overlay" onClick={onClose}>
      <div className="order-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="order-modal-header">
          <h3>
            MODIFY {orderSide} {symbol}
          </h3>
          <button type="button" className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="order-modal-meta">
          <span>{exchange}</span>
          <span className="ltp">LTP: {tick?.ltp ?? "—"}</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Order Type
              <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                <option value="MARKET">MARKET</option>
                <option value="LIMIT">LIMIT</option>
                <option value="SL">SL</option>
                <option value="SL-M">SL-M</option>
              </select>
            </label>

            <label>
              Quantity
              <input
                type="text"
                value={quantity}
                onChange={(e) => handleNumericChange(e.target.value, setQuantity)}
              />
            </label>

            <label>
              Price
              <input
                type="text"
                value={price}
                onChange={(e) => handleNumericChange(e.target.value, setPrice)}
                disabled={orderType === "MARKET" || orderType === "SL-M"}
                style={{
                  backgroundColor: (orderType === "MARKET" || orderType === "SL-M") ? "#2a2a2a" : undefined,
                  color: (orderType === "MARKET" || orderType === "SL-M") ? "#888" : undefined,
                  cursor: (orderType === "MARKET" || orderType === "SL-M") ? "not-allowed" : undefined,
                  opacity: (orderType === "MARKET" || orderType === "SL-M") ? 0.6 : 1
                }}
              />
            </label>

            {(orderType === "SL" || orderType === "SL-M") && (
              <>
                <label>
                  Trigger Price
                  <input
                    type="text"
                    value={triggerPrice}
                    onChange={(e) => handleNumericChange(e.target.value, setTriggerPrice)}
                  />
                </label>

                <label>
                  Stop Loss
                  <input
                    type="text"
                    value={stopLoss}
                    onChange={(e) => handleNumericChange(e.target.value, setStopLoss)}
                  />
                </label>
              </>
            )}
          </div>

          <button type="submit" className="submit-btn" disabled={loading} style={{ backgroundColor: orderSide === 'BUY' ? '#2196F3' : '#f44336' }}>
            {loading ? "Modifying..." : `Modify ${orderSide} Order`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ModifyOrderModal;
