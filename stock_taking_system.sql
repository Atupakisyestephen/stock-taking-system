-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 24, 2026 at 11:39 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `stock_taking_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `table_name` varchar(100) DEFAULT NULL,
  `record_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `ip_address` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `table_name`, `record_id`, `description`, `ip_address`, `created_at`) VALUES
(1, 1, 'LOGIN', 'users', 1, 'User \"Admin\" logged into the system.', '::1', '2026-08-21 09:24:18'),
(2, 1, 'LOGOUT', 'users', 1, 'User \"Admin\" logged out of the system.', '::1', '2026-08-21 09:46:29'),
(3, 1, 'LOGIN', 'users', 1, 'User \"Admin\" logged into the system.', '::1', '2026-08-24 08:21:25'),
(4, 1, 'LOGIN', 'users', 1, 'User \"Admin\" logged into the system.', '::1', '2026-08-24 08:30:38'),
(5, 1, 'LOGIN', 'users', 1, 'User \"Admin\" logged into the system.', '::1', '2026-08-24 08:55:29'),
(6, 1, 'LOGIN', 'users', 1, 'User \"Admin\" logged into the system.', '::1', '2026-08-24 09:32:58');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `category_name`, `description`, `status`, `created_at`) VALUES
(1, 'Footwear', NULL, 'active', '2026-08-13 08:50:01'),
(2, 'Furniture', NULL, 'active', '2026-08-13 08:50:43'),
(3, 'Office Supplies', NULL, 'active', '2026-08-13 08:50:59'),
(4, 'Electronics', NULL, 'active', '2026-08-13 08:51:11');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `product_code` varchar(100) NOT NULL,
  `product_name` varchar(200) NOT NULL,
  `unit` varchar(50) NOT NULL DEFAULT 'pcs',
  `buying_price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `selling_price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `quantity` decimal(15,2) NOT NULL DEFAULT 0.00,
  `minimum_stock` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `category_id`, `supplier_id`, `product_code`, `product_name`, `unit`, `buying_price`, `selling_price`, `quantity`, `minimum_stock`, `status`, `created_at`) VALUES
(1, 1, 1, 'P001', 'Sneakers & Sports Shoes', 'pair', 20000.00, 25000.00, 45.00, 5.00, 'active', '2026-08-13 09:12:42'),
(2, 1, 1, 'P002', 'Athletic & Sneakers', 'pair', 20000.00, 25000.00, 0.00, 0.00, 'active', '2026-08-24 09:20:38'),
(3, 1, 1, 'P003', 'Boots', 'pair', 30000.00, 35000.00, 5.00, 10.00, 'active', '2026-08-24 09:37:14');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `organization_name` varchar(150) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `currency` varchar(20) NOT NULL DEFAULT 'TZS',
  `logo` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `organization_name`, `phone`, `email`, `address`, `currency`, `logo`, `updated_at`) VALUES
(1, 'Pajebe Stock Taking', NULL, 'pajebestock@gmail.com', NULL, 'TZS', NULL, '2026-08-24 08:31:35');

-- --------------------------------------------------------

--
-- Table structure for table `stock_takings`
--

CREATE TABLE `stock_takings` (
  `id` int(11) NOT NULL,
  `reference_number` varchar(100) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('draft','in_progress','completed','cancelled') DEFAULT 'draft',
  `created_by` int(11) DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_takings`
--

INSERT INTO `stock_takings` (`id`, `reference_number`, `title`, `description`, `status`, `created_by`, `started_at`, `completed_at`, `created_at`) VALUES
(1, 'ST-20260818-0001', 'Monthy stock count - August 2026', NULL, 'completed', NULL, '2026-08-18 16:26:38', '2026-08-18 16:27:39', '2026-08-18 12:49:15'),
(2, 'ST-20260818-0002', 'Monthy stock count - July 2026', NULL, 'cancelled', NULL, NULL, NULL, '2026-08-18 13:28:27');

-- --------------------------------------------------------

--
-- Table structure for table `stock_taking_items`
--

CREATE TABLE `stock_taking_items` (
  `id` int(11) NOT NULL,
  `stock_taking_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `system_quantity` decimal(15,2) NOT NULL DEFAULT 0.00,
  `counted_quantity` decimal(15,2) DEFAULT NULL,
  `difference` decimal(15,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `counted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_taking_items`
--

INSERT INTO `stock_taking_items` (`id`, `stock_taking_id`, `product_id`, `system_quantity`, `counted_quantity`, `difference`, `notes`, `counted_at`) VALUES
(1, 1, 1, 40.00, 40.00, 0.00, NULL, '2026-08-18 16:27:19'),
(2, 2, 1, 40.00, NULL, 0.00, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `stock_transactions`
--

CREATE TABLE `stock_transactions` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `transaction_type` enum('stock_in','stock_out','adjustment') NOT NULL,
  `quantity` decimal(15,2) NOT NULL,
  `previous_quantity` decimal(15,2) NOT NULL DEFAULT 0.00,
  `new_quantity` decimal(15,2) NOT NULL DEFAULT 0.00,
  `reference_number` varchar(100) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `transaction_date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_transactions`
--

INSERT INTO `stock_transactions` (`id`, `product_id`, `user_id`, `transaction_type`, `quantity`, `previous_quantity`, `new_quantity`, `reference_number`, `reason`, `transaction_date`) VALUES
(1, 1, 1, 'stock_in', 10.00, 20.00, 30.00, NULL, NULL, '2026-08-17 14:45:48'),
(2, 1, 1, 'stock_out', 5.00, 30.00, 25.00, NULL, 'Sale', '2026-08-17 15:16:50'),
(3, 1, 1, 'stock_in', 15.00, 25.00, 40.00, NULL, 'Purchase', '2026-08-17 15:23:20'),
(4, 1, 2, 'stock_out', 5.00, 50.00, 45.00, NULL, 'Sale', '2026-08-21 11:56:33'),
(5, 2, 1, 'stock_out', 5.00, 5.00, 0.00, NULL, 'Sale', '2026-08-24 12:21:23');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL,
  `supplier_name` varchar(150) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `contact_person` varchar(150) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`id`, `supplier_name`, `phone`, `email`, `address`, `contact_person`, `status`, `created_at`) VALUES
(1, 'First Step Fashion (T) Limited', '+255 767 449 797', 'ayman-jaber@hotmail.com', 'Dar es Salaam, Tanzania)', 'Customer Support', 'active', '2026-08-13 09:00:58'),
(2, 'Tronic (Cash Sale Stores Limited)', '+255 740 500 000', 'sales@tronic.co.tz', 'Plot No 967/809, Block 75, Morogoro Road, Mali Street, Dar es Salaam,Tanzania', 'Customer Support', 'active', '2026-08-13 09:03:51');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','manager','staff') NOT NULL DEFAULT 'staff',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `password`, `role`, `status`, `created_at`) VALUES
(1, 'Admin', 'admin@stocksystem.com', '$2b$12$2/lzvFQiDqZ3mrDReo6gtuyvTRNnVwrdqM2g0W6mM0aTXqUbPBTy2', 'admin', 'active', '2026-08-13 08:12:05'),
(2, 'John Frank', 'johnfrank@gmail.com', '$2b$10$sG3dPODIKFKqvIN/337Hrukap2iGfjVM.CgLf/UZ4wpDOCuMeuG9i', 'staff', 'active', '2026-08-21 08:54:16');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `category_name` (`category_name`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `product_code` (`product_code`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `supplier_id` (`supplier_id`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `stock_takings`
--
ALTER TABLE `stock_takings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reference_number` (`reference_number`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `stock_taking_items`
--
ALTER TABLE `stock_taking_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `stock_taking_id` (`stock_taking_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `stock_transactions`
--
ALTER TABLE `stock_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `stock_takings`
--
ALTER TABLE `stock_takings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `stock_taking_items`
--
ALTER TABLE `stock_taking_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `stock_transactions`
--
ALTER TABLE `stock_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `products_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `stock_takings`
--
ALTER TABLE `stock_takings`
  ADD CONSTRAINT `stock_takings_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `stock_taking_items`
--
ALTER TABLE `stock_taking_items`
  ADD CONSTRAINT `stock_taking_items_ibfk_1` FOREIGN KEY (`stock_taking_id`) REFERENCES `stock_takings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stock_taking_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stock_transactions`
--
ALTER TABLE `stock_transactions`
  ADD CONSTRAINT `stock_transactions_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stock_transactions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
