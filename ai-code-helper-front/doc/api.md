## OEmployee 员工管理接口文档

### ip端口

### `http://localhost:8080`

| 请求方式   | API 路径                       | 功能描述         |
| :--------- | :----------------------------- | :--------------- |
| **POST**   | `/api/employees`               | 创建员工         |
| **PUT**    | `/api/employees`               | 更新员工信息     |
| **DELETE** | `/api/employees/{id}`          | 根据ID删除员工   |
| **GET**    | `/api/employees/{id}`          | 根据ID查询员工   |
| **GET**    | `/api/employees`               | 查询所有员工列表 |
| **GET**    | `/api/employees/code/{code}`   | 根据员工编号查询 |
| **GET**    | `/api/employees/phone/{phone}` | 根据手机号查询   |
| **GET**    | `/api/employees/name/{name}`   | 根据中文姓名查询 |

---

### 1. 创建员工

- **请求方式**：`POST`
- **API**：`/api/employees`
- **Content-Type**：`application/json`

**请求体（JSON）：**
```json
{
  "employeeCode": "string (员工编号)",
  "phoneNumber": "string (手机号)",
  "chineseName": "string (中文姓名)",
  "email": "string (邮箱)",
  "totalDiscount": "number (总折扣)",
  "monthlyQuota": "number (月度配额)",
  "objectVersionNumber": "number (版本号)",
  "creationDate": "string (创建时间, ISO格式)",
  "createdBy": "number (创建人ID)",
  "lastUpdatedBy": "number (更新人ID)",
  "lastUpdateDate": "string (更新时间, ISO格式)",
  "attributeVarchar1": "string (扩展字段1)",
  "attributeBigint1": "number (扩展字段2)",
  "attributeBigint30": "number (扩展字段3)",
  "attributeTinyint1": "number (扩展字段4)",
  "attributeDecimal1": "number (扩展字段5)",
  "attributeDatetime1": "string (扩展字段6, ISO格式)",
  "attributeDate1": "string (扩展字段7, ISO格式)"
}
```

**返回值**：`int` - 影响的行数

---

### 2. 更新员工

- **请求方式**：`PUT`
- **API**：`/api/employees`
- **Content-Type**：`application/json`

**请求体（JSON）：** 同创建员工，**必须包含 employeeId**

---

### 3. 删除员工

- **请求方式**：`DELETE`
- **API**：`/api/employees/{id}`

**路径参数：**

| 参数名 | 类型  | 说明   |
| :----- | :---- | :----- |
| `id`   | `int` | 员工ID |

**返回值**：`int` - 影响的行数

---

### 4. 根据ID查询员工

- **请求方式**：`GET`
- **API**：`/api/employees/{id}`

**路径参数：**

| 参数名 | 类型  | 说明   |
| :----- | :---- | :----- |
| `id`   | `int` | 员工ID |

**返回值**：`OEmployee` 员工对象

---

### 5. 查询所有员工

- **请求方式**：`GET`
- **API**：`/api/employees`

**返回值**：`List<OEmployee>` 员工列表

---

### 6. 根据员工编号查询

- **请求方式**：`GET`
- **API**：`/api/employees/code/{code}`

**路径参数：**

| 参数名 | 类型     | 说明     |
| :----- | :------- | :------- |
| `code` | `string` | 员工编号 |

**返回值**：`List<OEmployee>` 匹配的员工列表

---

### 7. 根据手机号查询

- **请求方式**：`GET`
- **API**：`/api/employees/phone/{phone}`

**路径参数：**

| 参数名  | 类型     | 说明     |
| :------ | :------- | :------- |
| `phone` | `string` | 手机号码 |

**返回值**：`List<OEmployee>` 匹配的员工列表

---

### 8. 根据中文姓名查询

- **请求方式**：`GET`
- **API**：`/api/employees/name/{name}`

**路径参数：**

| 参数名 | 类型     | 说明     |
| :----- | :------- | :------- |
| `name` | `string` | 中文姓名 |

**返回值**：`List<OEmployee>` 匹配的员工列表
        