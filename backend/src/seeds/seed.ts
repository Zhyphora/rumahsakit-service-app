import { AppDataSource } from "../config/database";
import { AccessControl } from "../entities/AccessControl";
import { User } from "../entities/User";
import { Role } from "../entities/Role";
import { Doctor } from "../entities/Doctor";
import { Staff } from "../entities/Staff";
import { Patient } from "../entities/Patient";
import { Polyclinic } from "../entities/Polyclinic";
import { Item } from "../entities/Item";
import { StockBatch } from "../entities/StockBatch";
import { StockOpname } from "../entities/StockOpname";
import { StockOpnameItem } from "../entities/StockOpnameItem";
import { StockOpnameStatus } from "../entities/StockOpname";
import { MedicalRecord } from "../entities/MedicalRecord";
import { Prescription } from "../entities/Prescription";
import { PrescriptionItem } from "../entities/PrescriptionItem";
import bcrypt from "bcryptjs";

async function seed() {
  try {
    AppDataSource.setOptions({ synchronize: true, dropSchema: true });
    await AppDataSource.initialize();
    console.log("Database connected and schema synchronized");

    // Create Repositories
    const userRepository = AppDataSource.getRepository(User);
    const roleRepository = AppDataSource.getRepository(Role);
    const doctorRepository = AppDataSource.getRepository(Doctor);
    const staffRepository = AppDataSource.getRepository(Staff);
    const patientRepository = AppDataSource.getRepository(Patient);
    const polyclinicRepository = AppDataSource.getRepository(Polyclinic);
    const itemRepository = AppDataSource.getRepository(Item);
    const acRepo = AppDataSource.getRepository(AccessControl);
    const medicalRecordRepo = AppDataSource.getRepository(MedicalRecord);
    const prescriptionRepo = AppDataSource.getRepository(Prescription);
    const prescriptionItemRepo = AppDataSource.getRepository(PrescriptionItem);

    // --- Create Roles ---
    // --- Create Roles ---
    const rolesData = [
      { name: "admin", description: "Administrator System with full access" },
      { name: "doctor", description: "Medical Doctor (Dokter)" },
      { name: "nurse", description: "Nurse (Perawat)" },
      { name: "pharmacist", description: "Pharmacist (Apoteker)" },
      {
        name: "registration_staff",
        description: "Registration Staff (Petugas Pendaftaran)",
      },
      {
        name: "inventory_staff",
        description: "Inventory / Warehouse Staff (Staf Gudang)",
      },
      { name: "patient", description: "Hospital Patient" },
    ];

    const roles: Record<string, Role> = {};

    for (const r of rolesData) {
      const role = roleRepository.create({
        name: r.name,
        description: r.description,
      });
      await roleRepository.save(role);
      roles[r.name] = role;
      console.log(`Created role: ${r.name}`);
    }

    const hashedPassword = await bcrypt.hash("password123", 10);

    // Create Admin
    const admin = userRepository.create({
      email: "admin@mediku.com",
      password: hashedPassword,
      name: "Admin Rumah Sakit",
      role: roles["admin"],
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
        email: "budi@mediku.com",
        specialization: "Dokter Umum",
        polyclinicIndex: 0,
        scheduleType: "pagi", // 08:00 - 14:00
      },
      {
        name: "Dr. Ratna Sari",
        email: "ratna@mediku.com",
        specialization: "Dokter Umum",
        polyclinicIndex: 0,
        scheduleType: "siang", // 13:00 - 20:00
      },
      // Poli Anak (index 1)
      {
        name: "Dr. Siti Rahayu",
        email: "siti@mediku.com",
        specialization: "Dokter Anak",
        polyclinicIndex: 1,
        scheduleType: "pagi",
      },
      {
        name: "Dr. Hendra Wijaya",
        email: "hendra@mediku.com",
        specialization: "Dokter Spesialis Anak",
        polyclinicIndex: 1,
        scheduleType: "siang",
      },
      // Poli Gigi (index 2)
      {
        name: "Dr. Ahmad Prasetyo",
        email: "ahmad@mediku.com",
        specialization: "Dokter Gigi",
        polyclinicIndex: 2,
        scheduleType: "pagi",
      },
      {
        name: "Dr. Lisa Permata",
        email: "lisa@mediku.com",
        specialization: "Dokter Gigi Spesialis",
        polyclinicIndex: 2,
        scheduleType: "siang",
      },
      // Poli Mata (index 3)
      {
        name: "Dr. Maria Dewi",
        email: "maria@mediku.com",
        specialization: "Dokter Mata",
        polyclinicIndex: 3,
        scheduleType: "pagi",
      },
      {
        name: "Dr. Agus Setiawan",
        email: "agus.dr@mediku.com",
        specialization: "Dokter Spesialis Mata",
        polyclinicIndex: 3,
        scheduleType: "siang",
      },
      // Poli THT (index 4)
      {
        name: "Dr. Yulia Andini",
        email: "yulia@mediku.com",
        specialization: "Dokter THT",
        polyclinicIndex: 4,
        scheduleType: "pagi",
      },
      {
        name: "Dr. Rizky Pratama",
        email: "rizky@mediku.com",
        specialization: "Dokter Spesialis THT",
        polyclinicIndex: 4,
        scheduleType: "siang",
      },
    ];

    const schedules = {
      pagi: {
        monday: { start: "06:00", end: "23:00" },
        tuesday: { start: "06:00", end: "23:00" },
        wednesday: { start: "06:00", end: "23:00" },
        thursday: { start: "06:00", end: "23:00" },
        friday: { start: "06:00", end: "23:00" },
      },
      siang: {
        monday: { start: "06:00", end: "23:00" },
        tuesday: { start: "06:00", end: "23:00" },
        wednesday: { start: "06:00", end: "23:00" },
        thursday: { start: "06:00", end: "23:00" },
        friday: { start: "06:00", end: "23:00" },
      },
      weekend: {
        saturday: { start: "06:00", end: "23:00" },
        sunday: { start: "06:00", end: "23:00" },
      },
    };

    // Add Weekend Doctors (1 per poli)
    doctors.push(
      // Poli Umum
      {
        name: "Dr. Farhan",
        email: "farhan@mediku.com",
        specialization: "Dokter Umum",
        polyclinicIndex: 0,
        scheduleType: "weekend",
      },
      // Poli Anak
      {
        name: "Dr. Diana",
        email: "diana@mediku.com",
        specialization: "Dokter Anak",
        polyclinicIndex: 1,
        scheduleType: "weekend",
      },
      // Poli Gigi
      {
        name: "Dr. Eko",
        email: "eko@mediku.com",
        specialization: "Dokter Gigi",
        polyclinicIndex: 2,
        scheduleType: "weekend",
      },
      // Poli Mata
      {
        name: "Dr. Fajar",
        email: "fajar@mediku.com",
        specialization: "Dokter Mata",
        polyclinicIndex: 3,
        scheduleType: "weekend",
      },
      // Poli THT
      {
        name: "Dr. Gilang",
        email: "gilang@mediku.com",
        specialization: "Dokter THT",
        polyclinicIndex: 4,
        scheduleType: "weekend",
      }
    );

    for (const doc of doctors) {
      const user = userRepository.create({
        email: doc.email,
        password: hashedPassword,
        name: doc.name,
        role: roles["doctor"],
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

    // Create Staff with Specific Roles
    // 1. Pharmacist (Apoteker)
    const pharmacistUser = userRepository.create({
      email: "joko@mediku.com",
      password: hashedPassword,
      name: "Joko Widodo",
      role: roles["pharmacist"],
      phone: "081234567891",
    });
    await userRepository.save(pharmacistUser);
    await staffRepository.save(
      staffRepository.create({
        userId: pharmacistUser.id,
        department: "Farmasi",
        position: "Apoteker",
      })
    );

    // 2. Registration Staff (Petugas Pendaftaran)
    const regStaffUser = userRepository.create({
      email: "dewi@mediku.com",
      password: hashedPassword,
      name: "Dewi Lestari",
      role: roles["registration_staff"],
      phone: "081234567892",
    });
    await userRepository.save(regStaffUser);
    await staffRepository.save(
      staffRepository.create({
        userId: regStaffUser.id,
        department: "Pendaftaran",
        position: "Petugas Loket",
      })
    );

    // 3. Nurse (Perawat) - Creating a few nurses
    const nurses = [
      { name: "Suster Siti", email: "siti.nurse@mediku.com" },
      { name: "Suster Ani", email: "ani.nurse@mediku.com" },
    ];
    for (const n of nurses) {
      const u = userRepository.create({
        email: n.email,
        password: hashedPassword,
        name: n.name,
        role: roles["nurse"],
        phone: "08123456789" + Math.floor(Math.random() * 9),
      });
      await userRepository.save(u);
      await staffRepository.save(
        staffRepository.create({
          userId: u.id,
          department: "Keperawatan",
          position: "Perawat",
        })
      );
    }

    // 4. Inventory Staff (Staf Gudang)
    const inventoryUser = userRepository.create({
      email: "budi.gudang@mediku.com",
      password: hashedPassword,
      name: "Budi Santoso (Gudang)",
      role: roles["inventory_staff"],
      phone: "081234567894",
    });
    await userRepository.save(inventoryUser);
    await staffRepository.save(
      staffRepository.create({
        userId: inventoryUser.id,
        department: "Logistik",
        position: "Staf Gudang",
      })
    );

    // 5. General Admin Staff
    const adminStaffUser = userRepository.create({
      email: "rina@mediku.com",
      password: hashedPassword,
      name: "Rina Marlina",
      role: roles["admin"], // Or registration_staff depending on needs, giving admin for now as she was 'Staff Admin'
      phone: "081234567895",
    });
    await userRepository.save(adminStaffUser);
    await staffRepository.save(
      staffRepository.create({
        userId: adminStaffUser.id,
        department: "Administrasi",
        position: "Staff Admin",
      })
    );

    console.log("Staff created with specific roles");

    // Create Sample Patients
    // Create Sample Patients
    const patients = [
      {
        name: "Agus Setiawan",
        mrn: "RM-001",
        dob: "1985-05-15",
        gender: "Laki-laki",
        phone: "081111111111",
        bpjs: "000123456789",
        email: "pasien@mediku.com", // Login for Agus
      },
      {
        name: "Sri Wahyuni",
        mrn: "RM-002",
        dob: "1990-08-20",
        gender: "Perempuan",
        phone: "081222222222",
        bpjs: "000987654321",
      },
      {
        name: "Bambang Susilo",
        mrn: "RM-003",
        dob: "1978-12-01",
        gender: "Laki-laki",
        phone: "081333333333",
        bpjs: "000555666777",
      },
    ];

    const createdPatients: Patient[] = [];

    for (const patientData of patients) {
      let userId = undefined;

      // Create User account for Agus
      if (patientData.email) {
        const user = userRepository.create({
          email: patientData.email,
          password: hashedPassword, // password123
          name: patientData.name,
          role: roles["patient"],
          phone: patientData.phone,
        });
        await userRepository.save(user);
        userId = user.id;
      }

      const patient = patientRepository.create({
        userId: userId,
        name: patientData.name,
        medicalRecordNumber: patientData.mrn,
        dateOfBirth: new Date(patientData.dob),
        gender: patientData.gender,
        phone: patientData.phone,
        address: "Jakarta, Indonesia",
        bpjsNumber: patientData.bpjs,
      });
      await patientRepository.save(patient);
      createdPatients.push(patient);
    }
    console.log("Patients created");

    // --- Create Medical Records & Prescriptions for Agus (Patient Portal Demo) ---
    // Past visit 1: Flu
    if (createdPatients.length > 0) {
      const agus = createdPatients[0];
      const generalOuter = await doctorRepository.findOne({
        where: { polyclinicId: createdPolyclinics[0].id },
      }); // Poli Umum doctor

      if (generalOuter) {
        const visitDate1 = new Date();
        visitDate1.setDate(visitDate1.getDate() - 10); // 10 days ago

        const medRecord1 = medicalRecordRepo.create({
          patientId: agus.id,
          doctorId: generalOuter.id,
          polyclinicId: createdPolyclinics[0].id,
          visitDate: visitDate1,
          diagnosis: "Influenza (Flu Berat)",
          actions:
            "Pemeriksaan fisik, cek suhu tubuh (38.5 C), pemberian obat penurun panas.",
          notes: "Istirahat cukup 3 hari.",
        });
        await medicalRecordRepo.save(medRecord1);

        // Prescription for visit 1
        const prescription1 = prescriptionRepo.create({
          patientId: agus.id,
          doctorId: generalOuter.id,
          medicalRecordId: medRecord1.id,
          status: "completed",
          diagnosis: medRecord1.diagnosis,
          notes: "Diminum setelah makan",
          dispensedAt: visitDate1,
        });
        await prescriptionRepo.save(prescription1);

        // Items will be linked if we had them created, but we create items later.
        // Ideally move item creation UP or just create dummy items here if needed.
        // We'll trust the items created below exist or just skip prescription items for now in this block
        // and create them closer to items creation if needed.
        // EDIT: Let's create Items FIRST in the file or just reference them if we move this block down.
        // Current position is BEFORE items. I should move this block AFTER items created.
      }
    }

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

    const createdItems: Item[] = [];
    for (const itemData of items) {
      const item = itemRepository.create(itemData);
      await itemRepository.save(item);
      createdItems.push(item);
    }
    console.log("Items created");

    // --- Create Medical Records & Prescriptions Linkage (NOW that items exist) ---
    if (createdPatients.length > 0 && createdItems.length > 0) {
      const agus = createdPatients[0];
      // Find a doctor
      const users = await userRepository.find({ relations: ["role"] });
      const doctors = await doctorRepository.find();
      const generalDoc = doctors[0];

      if (generalDoc && agus) {
        const visitDate1 = new Date();
        visitDate1.setDate(visitDate1.getDate() - 10);

        const medRecord1 = medicalRecordRepo.create({
          patientId: agus.id,
          doctorId: generalDoc.id,
          polyclinicId: generalDoc.polyclinicId,
          visitDate: visitDate1,
          diagnosis: "Acute Pharyngitis (Radang Tenggorokan)",
          actions:
            "Pemeriksaan fisik tenggorokan, pengecekan suhu (37.8 C). Edukasi banyak minum air putih.",
          notes: "Kontrol ulang jika demam > 3 hari.",
        });
        await medicalRecordRepo.save(medRecord1);

        // Prescription
        const prescription1 = prescriptionRepo.create({
          patientId: agus.id,
          doctorId: generalDoc.id,
          medicalRecordId: medRecord1.id,
          status: "completed",
          diagnosis: medRecord1.diagnosis,
          notes: "Diminum 3x1 hari",
          dispensedAt: visitDate1,
        });
        await prescriptionRepo.save(prescription1);

        // Add items to prescription (Paracetamol & Amoxicillin)
        const para = createdItems.find((i) => i.name.includes("Paracetamol"));
        const amox = createdItems.find((i) => i.name.includes("Amoxicillin"));

        if (para) {
          await prescriptionItemRepo.save({
            prescriptionId: prescription1.id,
            itemId: para.id,
            quantity: 10,
            notes: "3x1 tablet bila demam",
          });
        }
        if (amox) {
          await prescriptionItemRepo.save({
            prescriptionId: prescription1.id,
            itemId: amox.id,
            quantity: 15,
            notes: "3x1 tablet habiskan",
          });
        }

        console.log("Medical Record & Prescription created for Patient Agus");
      }
    }

    // --- Create Medical Records for Sri Wahyuni (Poli Gigi - Index 2) ---
    if (createdPatients.length > 1 && createdItems.length > 0) {
      const sri = createdPatients[1];
      const doctors = await doctorRepository.find({
        relations: ["polyclinic"],
      });
      // Find a dental doctor (Poly code PG or check polyclinic name)
      const dentalDoc = doctors.find(
        (d) =>
          d.polyclinic?.code === "PG" || d.polyclinic?.name.includes("Gigi")
      );

      if (dentalDoc && sri) {
        const visitDateSri = new Date();
        visitDateSri.setDate(visitDateSri.getDate() - 5);

        const medRecordSri = medicalRecordRepo.create({
          patientId: sri.id,
          doctorId: dentalDoc.id,
          polyclinicId: dentalDoc.polyclinicId,
          visitDate: visitDateSri,
          diagnosis: "Pulpitis Reversible",
          actions: "Pemeriksaan gigi berlubang, pembersihan, tambal sementara.",
          notes: "Kontrol 1 minggu lagi untuk tambal permanen.",
        });
        await medicalRecordRepo.save(medRecordSri);
        console.log("Medical Record created for Patient Sri Wahyuni");

        // Prescription
        const prescriptionSri = prescriptionRepo.create({
          patientId: sri.id,
          doctorId: dentalDoc.id,
          medicalRecordId: medRecordSri.id,
          status: "completed",
          diagnosis: medRecordSri.diagnosis,
          notes: "Obat pereda nyeri",
          dispensedAt: visitDateSri,
        });
        await prescriptionRepo.save(prescriptionSri);

        const para = createdItems.find((i) => i.name.includes("Paracetamol"));
        if (para) {
          await prescriptionItemRepo.save({
            prescriptionId: prescriptionSri.id,
            itemId: para.id,
            quantity: 10,
            notes: "3x1 tablet jika nyeri",
          });
        }
      }
    }

    // --- Create Medical Records for Bambang Susilo (Poli Mata - Index 3) ---
    if (createdPatients.length > 2 && createdItems.length > 0) {
      const bambang = createdPatients[2];
      const doctors = await doctorRepository.find({
        relations: ["polyclinic"],
      });
      const eyeDoc = doctors.find(
        (d) =>
          d.polyclinic?.code === "PM" || d.polyclinic?.name.includes("Mata")
      );

      if (eyeDoc && bambang) {
        const visitDateBambang = new Date();
        visitDateBambang.setDate(visitDateBambang.getDate() - 2);

        const medRecordBambang = medicalRecordRepo.create({
          patientId: bambang.id,
          doctorId: eyeDoc.id,
          polyclinicId: eyeDoc.polyclinicId,
          visitDate: visitDateBambang,
          diagnosis: "Konjungtivitis Bakterial",
          actions: "Pemeriksaan mata, irigasi mata, pemberian obat tetes.",
          notes: "Jangan mengucek mata.",
        });
        await medicalRecordRepo.save(medRecordBambang);
        console.log("Medical Record created for Patient Bambang Susilo");

        // Prescription
        const prescriptionBambang = prescriptionRepo.create({
          patientId: bambang.id,
          doctorId: eyeDoc.id,
          medicalRecordId: medRecordBambang.id,
          status: "completed",
          diagnosis: medRecordBambang.diagnosis,
          notes: "Obat tetes mata antibiotik",
          dispensedAt: visitDateBambang,
        });
        await prescriptionRepo.save(prescriptionBambang);
        // Note: We don't have eye drops in items right now, so strictly speaking
        // we might skip items or just give Vitamin C as support?
        // Let's give Vitamin C.
        const vitC = createdItems.find((i) => i.name.includes("Vitamin C"));
        if (vitC) {
          await prescriptionItemRepo.save({
            prescriptionId: prescriptionBambang.id,
            itemId: vitC.id,
            quantity: 10,
            notes: "1x1 tablet",
          });
        }
      }
    }

    // ----- Create Stock Batches for FIFO -----
    const batchRepo = AppDataSource.getRepository(StockBatch);
    const allItemsForBatch = await itemRepository.find();
    for (const it of allItemsForBatch) {
      await batchRepo.save({
        itemId: it.id,
        quantity: it.currentStock,
        receivedAt: new Date(),
      });
    }
    console.log("Stock batches created");

    // ----- Create a Draft Stock Opname for demo -----
    const opnameRepo = AppDataSource.getRepository(StockOpname);
    const opnameItemRepo = AppDataSource.getRepository(StockOpnameItem);
    const demoOpname = await opnameRepo.save({
      opnameDate: new Date(),
      status: "draft" as StockOpnameStatus,
      notes: "Demo opname created by seed",
      createdBy: admin.id,
    });
    // Add each item to the opname with systemQty = currentStock
    const allItems = await itemRepository.find();
    for (const it of allItems) {
      await opnameItemRepo.save({
        stockOpnameId: demoOpname.id,
        itemId: it.id,
        systemQty: it.currentStock,
        actualQty: null,
      });
    }
    console.log("Demo stock opname created");

    // ----- Access Control entries -----

    const rolePermissions: Record<string, string[]> = {
      admin: [
        "admin:access-control",
        "stock:read",
        "stock:manage",
        "stock:opname",
        "stock:adjust",
        "stock:correction",
        "stock:adjust_in",
        "stock:adjust_out",
        "queue:manage",
        "queue:read",
        "patient:read",
        "patient:manage",
        "pharmacy:manage",
        "document:verify",
        "attendance:manage",
      ],
      doctor: [
        "patient:read",
        "medical_record:write",
        "prescription:write",
        "queue:read",
        "queue:manage",
      ],
      nurse: ["patient:read", "patient:check_vitals", "queue:manage"],
      pharmacist: [
        "pharmacy:manage",
        "stock:read",
        "stock:manage", // Can manage medicine items
        "stock:adjust", // Can adjust stock if needed
        "prescription:read",
      ],
      registration_staff: [
        "queue:manage",
        "patient:manage",
        "patient:read",
        "document:verify",
      ],
      inventory_staff: [
        "stock:read",
        "stock:manage",
        "stock:opname",
        "stock:adjust",
        "stock:correction",
        "stock:adjust_in",
        "stock:adjust_out",
      ],
      patient: ["patient:portal_access"],
    };

    for (const [roleKey, features] of Object.entries(rolePermissions)) {
      const roleEntity = roles[roleKey];
      if (!roleEntity) continue;

      for (const feature of features) {
        await acRepo.save({ role: roleEntity, feature });
      }
      console.log(`Assigned permissions to ${roleKey}`);
    }
    console.log("Access control entries created");

    console.log("Seed completed successfully!");
    console.log("\nDefault credentials:");
    console.log("Admin: admin@mediku.com / password123");
    console.log("Doctors: [email]@mediku.com / password123");
    console.log("Staff: [email]@mediku.com / password123");

    await AppDataSource.destroy();
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seed();
