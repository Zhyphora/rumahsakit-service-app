import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { Doctor } from "../entities/Doctor";
import { Staff } from "../entities/Staff";
import { Patient } from "../entities/Patient";
import { Polyclinic } from "../entities/Polyclinic";
import { Item } from "../entities/Item";
import bcrypt from "bcryptjs";

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log("Database connected");

    // Truncate all tables before seeding
    console.log("Truncating existing data...");
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    // Disable foreign key checks temporarily and truncate tables
    // Order matters: child tables first, then parent tables
    const tablesToTruncate = [
      "prescription_items",
      "prescriptions",
      "document_access_logs",
      "document_access",
      "documents",
      "queue_numbers",
      "queue_counters",
      "stock_opname_items",
      "stock_opnames",
      "stock_movements",
      "leave_requests",
      "attendances",
      "doctors",
      "staff",
      "patients",
      "items",
      "polyclinics",
      "users",
    ];

    for (const table of tablesToTruncate) {
      try {
        await queryRunner.query(`TRUNCATE TABLE "${table}" CASCADE`);
        console.log(`  ✓ Truncated ${table}`);
      } catch (error: any) {
        // Table might not exist yet, skip
        console.log(`  - Skipped ${table} (may not exist)`);
      }
    }

    await queryRunner.release();
    console.log("Truncate completed.\n");

    // Create admin user
    const userRepository = AppDataSource.getRepository(User);
    const doctorRepository = AppDataSource.getRepository(Doctor);
    const staffRepository = AppDataSource.getRepository(Staff);
    const patientRepository = AppDataSource.getRepository(Patient);
    const polyclinicRepository = AppDataSource.getRepository(Polyclinic);
    const itemRepository = AppDataSource.getRepository(Item);

    const hashedPassword = await bcrypt.hash("password123", 10);

    // Create Admin
    const admin = userRepository.create({
      email: " ",
      password: hashedPassword,
      name: "Admin Rumah Sakit",
      role: "admin",
      phone: "081234567890",
    });
    await userRepository.save(admin);
    console.log("Admin user created");

    // Create Polyclinics
    const polyclinics = [
      {
        name: "Poli Umum",
        code: "PU",
        description: "Poliklinik untuk pemeriksaan umum",
      },
      {
        name: "Poli Anak",
        code: "PA",
        description: "Poliklinik khusus anak-anak",
      },
      {
        name: "Poli Gigi",
        code: "PG",
        description: "Poliklinik gigi dan mulut",
      },
      { name: "Poli Mata", code: "PM", description: "Poliklinik mata" },
      {
        name: "Poli THT",
        code: "PT",
        description: "Poliklinik Telinga Hidung Tenggorokan",
      },
    ];

    const createdPolyclinics = [];
    for (const poly of polyclinics) {
      const polyclinic = polyclinicRepository.create(poly);
      await polyclinicRepository.save(polyclinic);
      createdPolyclinics.push(polyclinic);
    }
    console.log("Polyclinics created");

    // Create Doctors (2 per polyclinic)
    const doctors = [
      // Poli Umum (index 0)
      {
        name: "Dr. Budi Santoso",
        email: "budi@rumahsakit.com",
        specialization: "Dokter Umum",
        polyclinicIndex: 0,
        scheduleType: "pagi", // 08:00 - 14:00
      },
      {
        name: "Dr. Ratna Sari",
        email: "ratna@rumahsakit.com",
        specialization: "Dokter Umum",
        polyclinicIndex: 0,
        scheduleType: "siang", // 13:00 - 20:00
      },
      // Poli Anak (index 1)
      {
        name: "Dr. Siti Rahayu",
        email: "siti@rumahsakit.com",
        specialization: "Dokter Anak",
        polyclinicIndex: 1,
        scheduleType: "pagi",
      },
      {
        name: "Dr. Hendra Wijaya",
        email: "hendra@rumahsakit.com",
        specialization: "Dokter Spesialis Anak",
        polyclinicIndex: 1,
        scheduleType: "siang",
      },
      // Poli Gigi (index 2)
      {
        name: "Dr. Ahmad Prasetyo",
        email: "ahmad@rumahsakit.com",
        specialization: "Dokter Gigi",
        polyclinicIndex: 2,
        scheduleType: "pagi",
      },
      {
        name: "Dr. Lisa Permata",
        email: "lisa@rumahsakit.com",
        specialization: "Dokter Gigi Spesialis",
        polyclinicIndex: 2,
        scheduleType: "siang",
      },
      // Poli Mata (index 3)
      {
        name: "Dr. Maria Dewi",
        email: "maria@rumahsakit.com",
        specialization: "Dokter Mata",
        polyclinicIndex: 3,
        scheduleType: "pagi",
      },
      {
        name: "Dr. Agus Setiawan",
        email: "agus.dr@rumahsakit.com",
        specialization: "Dokter Spesialis Mata",
        polyclinicIndex: 3,
        scheduleType: "siang",
      },
      // Poli THT (index 4)
      {
        name: "Dr. Yulia Andini",
        email: "yulia@rumahsakit.com",
        specialization: "Dokter THT",
        polyclinicIndex: 4,
        scheduleType: "pagi",
      },
      {
        name: "Dr. Rizky Pratama",
        email: "rizky@rumahsakit.com",
        specialization: "Dokter Spesialis THT",
        polyclinicIndex: 4,
        scheduleType: "siang",
      },
    ];

    const schedules = {
      pagi: {
        monday: { start: "08:00", end: "14:00" },
        tuesday: { start: "08:00", end: "14:00" },
        wednesday: { start: "08:00", end: "14:00" },
        thursday: { start: "08:00", end: "14:00" },
        friday: { start: "08:00", end: "12:00" },
      },
      siang: {
        monday: { start: "13:00", end: "20:00" },
        tuesday: { start: "13:00", end: "20:00" },
        wednesday: { start: "13:00", end: "20:00" },
        thursday: { start: "13:00", end: "20:00" },
        friday: { start: "13:00", end: "17:00" },
      },
    };

    for (const doc of doctors) {
      const user = userRepository.create({
        email: doc.email,
        password: hashedPassword,
        name: doc.name,
        role: "doctor",
        phone: "08" + Math.random().toString().substring(2, 12),
      });
      await userRepository.save(user);

      const doctor = doctorRepository.create({
        userId: user.id,
        specialization: doc.specialization,
        polyclinicId: createdPolyclinics[doc.polyclinicIndex].id,
        licenseNumber: "STR-" + Math.random().toString().substring(2, 10),
        schedule: schedules[doc.scheduleType as keyof typeof schedules],
      });
      await doctorRepository.save(doctor);
    }
    console.log("Doctors created (10 total)");

    // Create Staff
    const staffMembers = [
      {
        name: "Rina Marlina",
        email: "rina@rumahsakit.com",
        department: "Administrasi",
        position: "Staff Admin",
      },
      {
        name: "Joko Widodo",
        email: "joko@rumahsakit.com",
        department: "Farmasi",
        position: "Apoteker",
      },
      {
        name: "Dewi Lestari",
        email: "dewi@rumahsakit.com",
        department: "Pendaftaran",
        position: "Petugas Loket",
      },
    ];

    for (const staffData of staffMembers) {
      const user = userRepository.create({
        email: staffData.email,
        password: hashedPassword,
        name: staffData.name,
        role: "staff",
        phone: "08" + Math.random().toString().substring(2, 12),
      });
      await userRepository.save(user);

      const staff = staffRepository.create({
        userId: user.id,
        department: staffData.department,
        position: staffData.position,
      });
      await staffRepository.save(staff);
    }
    console.log("Staff created");

    // Create Sample Patients
    const patients = [
      {
        name: "Agus Setiawan",
        mrn: "RM-001",
        dob: "1985-05-15",
        gender: "Laki-laki",
        phone: "081111111111",
      },
      {
        name: "Sri Wahyuni",
        mrn: "RM-002",
        dob: "1990-08-20",
        gender: "Perempuan",
        phone: "081222222222",
      },
      {
        name: "Bambang Susilo",
        mrn: "RM-003",
        dob: "1978-12-01",
        gender: "Laki-laki",
        phone: "081333333333",
      },
      {
        name: "Fitri Handayani",
        mrn: "RM-004",
        dob: "1995-03-25",
        gender: "Perempuan",
        phone: "081444444444",
      },
      {
        name: "Rudi Hermawan",
        mrn: "RM-005",
        dob: "1982-07-10",
        gender: "Laki-laki",
        phone: "081555555555",
      },
    ];

    for (const patientData of patients) {
      const patient = patientRepository.create({
        name: patientData.name,
        medicalRecordNumber: patientData.mrn,
        dateOfBirth: new Date(patientData.dob),
        gender: patientData.gender,
        phone: patientData.phone,
        address: "Jakarta, Indonesia",
      });
      await patientRepository.save(patient);
    }
    console.log("Patients created");

    // Create Sample Items (Medical Supplies)
    const items = [
      {
        code: "OBT-001",
        name: "Paracetamol 500mg",
        category: "obat",
        unit: "tablet",
        minStock: 100,
        currentStock: 500,
        price: 500,
      },
      {
        code: "OBT-002",
        name: "Amoxicillin 500mg",
        category: "obat",
        unit: "kapsul",
        minStock: 50,
        currentStock: 200,
        price: 1500,
      },
      {
        code: "OBT-003",
        name: "Vitamin C 1000mg",
        category: "obat",
        unit: "tablet",
        minStock: 100,
        currentStock: 300,
        price: 2000,
      },
      {
        code: "ALT-001",
        name: "Masker Medis",
        category: "alat_medis",
        unit: "pcs",
        minStock: 200,
        currentStock: 1000,
        price: 1000,
      },
      {
        code: "ALT-002",
        name: "Sarung Tangan Latex",
        category: "alat_medis",
        unit: "pasang",
        minStock: 100,
        currentStock: 500,
        price: 3000,
      },
      {
        code: "ALT-003",
        name: "Syringe 3ml",
        category: "alat_medis",
        unit: "pcs",
        minStock: 200,
        currentStock: 800,
        price: 2500,
      },
      {
        code: "SUP-001",
        name: "Kapas",
        category: "supplies",
        unit: "pack",
        minStock: 50,
        currentStock: 100,
        price: 15000,
      },
      {
        code: "SUP-002",
        name: "Alkohol 70%",
        category: "supplies",
        unit: "botol",
        minStock: 30,
        currentStock: 80,
        price: 25000,
      },
    ];

    for (const itemData of items) {
      const item = itemRepository.create(itemData);
      await itemRepository.save(item);
    }
    console.log("Items created");

    console.log("Seed completed successfully!");
    console.log("\nDefault credentials:");
    console.log("Admin: admin@rumahsakit.com / password123");
    console.log("Doctors: [email]@rumahsakit.com / password123");
    console.log("Staff: [email]@rumahsakit.com / password123");

    await AppDataSource.destroy();
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seed();
