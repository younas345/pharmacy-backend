# Client Requirements Analysis - Meeting Transcript

## Executive Summary

The client is **pivoting from a full reverse distributor platform to a data analytics company**. The core business model is to become a data warehouse that helps pharmacies maximize their returns by identifying which reverse distributor pays the best price for each medication (NDC code).

---

## 🎯 Core Problem Statement

**Pharmacies don't know which reverse distributor pays the best** for each medication. They currently:
- Send medications to one reverse distributor per month
- Receive unknown/uncertain payment amounts
- Have no visibility into pricing differences between reverse distributors
- Cannot optimize their returns for maximum profit

---

## 💡 Solution Overview

Create a **data analytics platform** that:
1. Collects payment data from pharmacies (credit reports from reverse distributors)
2. Analyzes pricing per NDC code per reverse distributor
3. Provides recommendations on which reverse distributor to use for each product
4. Helps pharmacies maximize their returns

---

## 📋 PHASE 1 REQUIREMENTS (IMMEDIATE PRIORITY)

### 1. Data Input Pipeline ⚠️ **CRITICAL**
   - **PDF Document Processing**: Read and parse credit reports from reverse distributors
   - **Multiple Format Support**: Handle different document formats from different companies (30+ reverse distributors)
   - **Dynamic Parsing**: System should adapt to different formats automatically
   - **Data Extraction**: Extract:
     - Reverse distributor name
     - NDC codes
     - Lot numbers
     - Expiration dates
     - Quantity
     - Credit amount per product
     - Price per unit (calculated: credit amount / quantity)
     - Manufacturer information

### 2. Multi-Tenant Platform
   - **Pharmacy Sign-up**: Simple sign-up process (credit card + pharmacy ID)
   - **User Authentication**: Login system for pharmacies
   - **Data Storage**: Store data per pharmacy (multi-tenant architecture)
   - **Historical Data**: Track and store historical payment data

### 3. Data Upload Methods
   - **Manual Upload**: Pharmacy can upload PDF files directly
   - **Email Integration**: Automated pipeline when pharmacies forward emails from reverse distributors
   - **Portal Login**: Ability to login to reverse distributor portals and fetch data (credentials provided)
   - **API Integration**: Future capability to connect to pharmacy systems

### 4. Analytics & Reporting Engine
   - **Price Calculation**: Calculate price per NDC per reverse distributor
   - **Comparison Analysis**: Show which reverse distributor pays best for each NDC code
   - **Recommendation Engine**: Generate reports showing:
     - "Use Reverse Distributor A for NDC code X"
     - "Use Reverse Distributor B for NDC code Y"
     - "Use Reverse Distributor C for NDC code Z"
   - **Historical Analytics**: Show average amounts, trends over time
   - **Profit Optimization**: Help pharmacies split shipments to multiple distributors for maximum profit

### 5. Product Scanning/Upload
   - **NDC Code Scanning**: Allow pharmacies to scan barcodes (NDC codes)
   - **Manual Entry**: Allow manual entry of NDC codes
   - **Bulk Upload**: Upload spreadsheet/list of NDC codes to return
   - **Product List Management**: Manage list of products to return
   - **NDC Database**: Pre-populated NDC database for easy selection

### 6. Output/Reports
   - **Optimization Report**: 
     - Which reverse distributor to use for each product
     - Expected payment amounts
     - Profit maximization recommendations
   - **Comparison View**: Show pricing comparison across all reverse distributors
   - **Analytics Dashboard**: Visual analytics showing pricing trends

### 7. Subscription Model
   - **Payment Integration**: Credit card processing
   - **Subscription Management**: Monthly subscription fees
   - **Free Trial Option**: Consider offering free service in exchange for data (with legal considerations)

---

## 🔧 Technical Requirements

### Data Processing
- **PDF Parsing**: Robust PDF text extraction and table parsing
- **OCR Capability**: Handle scanned PDFs if needed
- **Data Normalization**: Standardize data from different formats
- **Data Validation**: Ensure data accuracy and completeness

### Database Design
- **NDC Code Storage**: Store NDC codes with metadata
- **Pricing Data**: Store price per NDC per reverse distributor
- **Historical Records**: Track all payment transactions
- **Pharmacy Data**: Multi-tenant data isolation

### Analytics Engine
- **Price Calculation**: Real-time price per unit calculations
- **Comparison Algorithms**: Best price finder per NDC
- **Aggregation**: Average prices, trends, statistics

---

## 📊 Business Model

### Revenue Streams
1. **Subscription Fees**: Monthly subscription from pharmacies
2. **Marketplace** (Future): Percentage of transactions
3. **Chrome Extension** (Future): Premium feature
4. **Reverse Distributor Services** (Future): Charge reverse distributors for analytics

### Target Market
- **Initial**: 100 pharmacies (to gather data on ~10 reverse distributors)
- **Scale**: 10,000+ pharmacies nationwide
- **Market Size**: 80,000 pharmacies in the US

---

## 🚀 Future Phases (Not Immediate)

### Phase 1b: Inventory Tracking
- Track pharmacy inventory
- Expiration date monitoring
- Automated notifications for expiring products
- Integration with pharmacy software

### Phase 2: Chrome Browser Extension
- Overlay pricing on wholesale distributor websites
- Show potential profit when buying products
- Real-time price comparison

### Phase 3: Marketplace
- Pharmacy-to-pharmacy trading
- Direct sales platform
- Transaction fee revenue

### Phase 4: Direct Manufacturer Contracts
- Become the reverse distributor
- Direct contracts with manufacturers
- Bypass Inmar (current destruction company)

---

## ⚠️ Key Constraints & Considerations

1. **Legal Compliance**: Cannot give free services to healthcare providers (legal restrictions)
2. **Data Privacy**: Healthcare data handling requirements
3. **Format Variations**: 30+ different reverse distributors = 30+ different formats
4. **Data Quality**: Pharmacies may not track inventory well
5. **Competition**: 30+ existing reverse distributor companies

---

## 🎯 IMMEDIATE ACTION ITEMS (From Meeting)

1. **Focus on Data Input Pipeline**: 
   - Create prototype to read example PDF files
   - Parse credit reports from reverse distributors
   - Extract: NDC codes, lot numbers, expiration dates, quantities, credit amounts

2. **Analytics Prototype**:
   - Calculate price per NDC per reverse distributor
   - Show comparison: "This reverse distributor pays X for NDC Y"

3. **Multi-Tenant Platform Foundation**:
   - Sign-up/login system
   - Data storage per pharmacy
   - Basic dashboard

4. **Document Processing**:
   - Handle the example report provided
   - Make it work for different companies' formats
   - Dynamic parsing capability

---

## 📝 Example Use Case

1. Pharmacy receives credit report PDF from Reverse Distributor A
2. Pharmacy uploads PDF to platform (or forwards email)
3. System extracts:
   - NDC: 12345-678-90
   - Quantity: 56 pills
   - Credit: $26.26
   - Price per pill: $0.469
4. Pharmacy scans products to return (20 different NDC codes)
5. System generates report:
   - "Send NDC 12345 to Reverse Distributor A (best price: $0.469/pill)"
   - "Send NDC 67890 to Reverse Distributor B (best price: $0.52/pill)"
   - "Send NDC 11111 to Reverse Distributor C (best price: $0.45/pill)"
6. Pharmacy packages accordingly and maximizes profit

---

## 🔑 Success Criteria

- **Data Collection**: Successfully parse credit reports from multiple reverse distributors
- **Price Calculation**: Accurately calculate price per NDC per distributor
- **Recommendations**: Provide actionable recommendations to pharmacies
- **User Experience**: Simple sign-up, easy data upload, clear reports
- **Scalability**: Handle 100+ pharmacies, 30+ reverse distributors, thousands of NDC codes

---

## 📌 Notes from Meeting

- Client mentioned having login credentials for a reverse distributor portal
- Example PDF report was shared (needs to be processed)
- Focus should be on **data input and analytics** first
- Inventory tracking is Phase 1b (not immediate priority)
- NDC barcode scanning is straightforward (barcode = NDC code)
- Lot numbers may need manual entry (unless automated)
- Pharmacies typically don't track inventory well
- System should be "analytics heavy"

---

## 🎬 Next Steps

1. **Review example PDF files** provided by client
2. **Build PDF parsing prototype** for credit reports
3. **Create data extraction pipeline**
4. **Develop analytics engine** for price comparison
5. **Design multi-tenant architecture**
6. **Build basic UI** for upload and reports

---

*Generated from meeting transcript analysis*

