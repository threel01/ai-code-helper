-- KEYS[1]: 商品库存的 Key (例如: seckill:stock:1001)
-- KEYS[2]: 已购用户集合的 Key (例如: seckill:buyer:1001)
-- ARGV[1]: 用户ID
-- ARGV[2]: 购买数量

-- 1. 校验用户是否重复购买 (利用 Set 集合判断)
local userId = ARGV[1]
local buyKey = KEYS[2]
if redis.call('sismember', buyKey, userId) == 1 then
    return -1  -- 返回 -1 代表用户已经购买过
end

-- 2. 获取并校验库存
local stockKey = KEYS[1]
local stock = tonumber(redis.call('get', stockKey))
local quantity = tonumber(ARGV[2])

if not stock or stock < quantity then
    return -2  -- 返回 -2 代表库存不足
end

-- 3. 原子性扣减库存
redis.call('decrby', stockKey, quantity)

-- 4. 将用户加入已购集合 (设置过期时间，例如 3600 秒，防止集合无限膨胀)
redis.call('sadd', buyKey, userId)
redis.call('expire', buyKey, 3600)

-- 5. 可选：将成功的订单信息推送到 Stream 队列，供后续异步下单入库
-- redis.call('xadd', 'seckill:order:stream', '*', 'userId', userId, 'quantity', quantity)

return 1  -- 返回 1 代表秒杀成功