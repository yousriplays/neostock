import math

def calculate_eoq(annual_demand: float, ordering_cost: float, holding_cost: float) -> int:
    """
    Calculate Economic Order Quantity
    """
    if holding_cost <= 0:
        return 0
    eoq = math.sqrt((2 * annual_demand * ordering_cost) / holding_cost)
    return int(round(eoq))

def calculate_reorder_point(daily_demand: float, lead_time: int, safety_days: int = 3) -> int:
    """
    Calculate Reorder Point
    """
    lead_time_demand = daily_demand * lead_time
    safety_stock = calculate_safety_stock(daily_demand, lead_time, safety_days)
    return int(round(lead_time_demand + safety_stock))

def calculate_safety_stock(daily_demand: float, lead_time: int, safety_days: int = 3) -> int:
    """
    Calculate Safety Stock
    """
    return int(round(daily_demand * safety_days))

def days_until_stockout(current_stock: int, daily_demand: float) -> int:
    """
    Estimate days until stockout
    """
    if daily_demand <= 0:
        return 9999
    return int(math.floor(current_stock / daily_demand))
