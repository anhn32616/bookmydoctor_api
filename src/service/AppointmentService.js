const db = require('../models/index');
const ScheduleServices = require('./ScheduleService');
const patientService = require('./PatientService');
const { Op, where } = require('sequelize');
const emailService = require('./emailService');
const notificationService = require('./NotificationService');
const violationService = require('./ViolationService');
const doctorService = require('./DoctorService');

// create Appointment
let createAppointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let resData = {};
            let [status, created] = await db.Status.findOrCreate({
                where: { name: "NEW" }, raw: true
            })
            let data2 = {};
            data2.id = data.user_id;
            let data3 = {};
            data3.id = data.schedule_id;
            let patient = await patientService.getPatientFromIdUser(data2);
            if (!patient) {
                resData.errCode = 1;
                resData.message = 'Không tìm thấy bệnh nhân';
                resolve(resData);
                return;
            }

            let resSchedule = await ScheduleServices.getScheduleById(data3);
            let check = await db.Appointment.findOne({
                where: {
                    schedule_id: resSchedule.message.id,
                    patient_id: patient.id
                }
            })
            if (check) {
                resData.errCode = 4;
                resData.message = 'Bạn đã đăng ký lịch khám này';
                resolve(resData);
                return;
            }
            if (resSchedule.errCode !== 0) {
                resData.errCode = 2;
                resData.message = 'Không tìm thấy lịch khám';
                resolve(resData);
                return;
            }
            if (resSchedule.message.status == true) {
                resData.errCode = 3;
                resData.message = 'Đã hết lượt khám';
                resolve(resData);
                return;
            }

            let appointment = await db.Appointment.create({
                patient_id: patient.id,
                schedule_id: resSchedule.message.id,
                date: resSchedule.message.begin,
                symptoms: data.symptom,
                status_id: status.id,
                paid: false
            });
            if (appointment) {
                // Tao thong bao lich kham cho bac si
                let message = `Bệnh nhân ${patient.user.firsname} ${patient.user.lastname} đăng ký lịch khám ngày ${appointment.date.toLocaleString('en-US', { timeZone: "Asia/Jakarta" })}`;
                notificationService.CreateNotification(appointment.id, resSchedule.message.doctor.user.id, message);
                notificationService.deleteNotificationOfUserLastWeek(resSchedule.message.doctor.user.id);
                let dataSend = {};
                dataSend.message = message;
                dataSend.receiverEmail = resSchedule.message.doctor.user.email;
                emailService.sendNotification(dataSend);
                resData.errCode = 0;
                resData.message = 'OK';
                resData.data = appointment;
                resData.notification = [
                    {
                        usersId: [resSchedule.message.doctor.user.id],
                        message: message
                    }
                ]
            }
            resolve(resData);
        } catch (e) {
            reject(e);
        }

    });
}
// get All Appointments
let getAllAppointments = (key, page, limit, status, date_string, rate) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Xoa cac cuoc hen bi tre va xu ly chuyen trang thai cac cuoc hen sang done
            await DeleteAppointmentStatusNew();
            await ChangeStatusAppointmentToDone();
            ////////////////////////////////
            page = page - 0;
            limit = limit - 0;
            rate = rate - 0;
            let offset = page * limit;
            let requirement = {};
            if (status !== '') {
                requirement = { name: status };
            }
            let requirementDate = {};
            if (date_string !== '') {
                let dateStart = new Date(date_string);
                let dateEnd = new Date(date_string);
                dateEnd.setDate(dateStart.getDate() + 1);
                // Chuyen sang mui gio +7
                dateStart.setHours(dateStart.getHours() - 7);
                dateEnd.setHours(dateEnd.getHours() - 7);

                console.log(dateStart, dateEnd);
                requirementDate = {
                    date: {
                        [Op.between]: [dateStart, dateEnd]
                    }
                }
            }
            let requirementRate = {};
            if (Number.isInteger(rate) && (rate >= 1) && (rate <= 5)) {
                requirementRate = {
                    rating: rate
                };
            }

            const { count, rows } = await db.Appointment.findAndCountAll({
                include: [
                    {
                        model: db.Patient,
                        required: true,
                        as: 'patient',
                        include:
                        {
                            model: db.User,
                            required: true,
                            as: 'user',
                            attributes: {
                                exclude: ['password', 'token']
                            },
                        },
                    },

                    {
                        model: db.Schedule,
                        required: true,
                        as: 'schedule',
                        include:
                        {
                            model: db.Doctor,
                            required: true,
                            as: 'doctor',
                            include:
                            {
                                model: db.User,
                                required: true,
                                as: 'user',
                                attributes: {
                                    exclude: ['password', 'token']
                                },
                            }
                        }
                    },
                    {
                        model: db.Status,
                        required: true,
                        as: 'status',
                        where: requirement
                    }
                ],
                where: {
                    [Op.and]: [
                        {
                            [Op.or]: [
                                { Patientname: db.sequelize.where(db.sequelize.fn('concat', db.sequelize.col('patient.user.firsname'), " ", db.sequelize.col('patient.user.lastname')), 'LIKE', '%' + key + '%') },
                                { Doctorname: db.sequelize.where(db.sequelize.fn('concat', db.sequelize.col('schedule.doctor.user.firsname'), " ", db.sequelize.col('schedule.doctor.user.lastname')), 'LIKE', '%' + key + '%') }
                            ]
                        },
                        requirementDate,
                        requirementRate
                    ]
                },
                order: [
                    ['date', 'DESC']
                ],
                offset: offset,
                limit: limit,
                raw: true,
                nest: true,
            });
            let resData = {};
            resData.appointment = rows;
            resData.limit = limit;
            resData.totalPages = Math.ceil(count / limit);
            resData.totalElements = count
            resData.page = page;
            resolve(resData);
        } catch (err) {
            reject(err);
        }
    });
}
// get Appointment By Id
let getAppointmentById = (id, userId, role_name) => {
    return new Promise(async (resolve, reject) => {
        try {
            let resData = {};
            let appointment = await db.Appointment.findByPk(id, {
                include: [
                    {
                        model: db.Patient,
                        required: true,
                        as: 'patient',
                        include:
                        {
                            model: db.User,
                            required: true,
                            as: 'user',
                            attributes: {
                                exclude: ['password', 'token']
                            },
                        },
                    },

                    {
                        model: db.Schedule,
                        required: true,
                        as: 'schedule',
                        include:
                        {
                            model: db.Doctor,
                            required: true,
                            as: 'doctor',
                            include:
                            {
                                model: db.User,
                                required: true,
                                as: 'user',
                                attributes: {
                                    exclude: ['password', 'token']
                                },
                            }
                        }
                    },
                    {
                        model: db.Status,
                        required: true,
                        as: 'status'
                    }
                ],
                raw: true,
                nest: true,
            });
            if (!appointment) {
                resData.errCode = 1;
                resData.message = 'Cuộc hẹn không tồn tại';
                resolve(resData);
                return;
            }
            if (role_name !== 'ROLE_ADMIN') {
                if (appointment.patient.user.id !== userId && appointment.schedule.doctor.user.id !== userId) {
                    resData.errCode = 2;
                    resData.message = 'Chỉ admin mới xem được thông tin lịch khám cửa người dùng khác';
                    resolve(resData);
                    return;
                }
            }
            resData.errCode = 0;
            resData.message = appointment;
            resolve(resData);
        } catch (err) {
            reject(err);
        }
    });
}
// accept Appointment
let acceptAppointment = (id, userId) => {
    return new Promise(async (resolve, reject) => {
        let resData = {};
        try {
            ///////////
            // Kiem tra xem bac si da tra tien phi su dung thang hay chua
            let checkPaid = await doctorService.checkPaid(userId);
            if (!checkPaid) {
                resData.errCode = 4;
                resData.message = 'Bạn chưa trả phí sử dụng tháng này';
                resolve(resData);
                return;
            }
            ///////////
            let appointment = await db.Appointment.findByPk(id, {
                include: [
                    {
                        model: db.Patient,
                        required: true,
                        as: 'patient',
                        include:
                        {
                            model: db.User,
                            required: true,
                            as: 'user',
                            attributes: {
                                exclude: ['password', 'token']
                            },
                        },
                    },
                    {
                        model: db.Schedule,
                        required: true,
                        as: 'schedule',
                        include:
                        {
                            model: db.Doctor,
                            required: true,
                            as: 'doctor',
                            include:
                            {
                                model: db.User,
                                required: true,
                                as: 'user',
                                attributes: {
                                    exclude: ['password', 'token']
                                },
                            }
                        }
                    },
                    {
                        model: db.Status,
                        required: true,
                        as: 'status'
                    }
                ],

            });
            if (!appointment) {
                resData.errCode = 1;
                resData.message = "Cuộc hẹn không tồn tại";
                resolve(resData);
                return;
            }
            if (appointment.schedule.doctor.user.id != userId) {
                resData.errCode = 3;
                resData.message = "Không có quyền chấp nhận cuộc hẹn";
                resolve(resData);
                return;
            }
            if (appointment.status.name !== "NEW") {
                resData.errCode = 2;
                resData.message = "Trạng thái cuộc hẹn không phải là NEW";
                resolve(resData);
                return;
            }
            let [statusConfirmed, created2] = await db.Status.findOrCreate({
                where: { name: "CONFIRMED" }, raw: true
            });
            let statusNew = appointment.status_id;
            appointment.status_id = statusConfirmed.id;
            await appointment.save();
            await db.Schedule.update({
                status: true,
            }, {
                where: { id: appointment.schedule.id }
            });
            // Tao thong bao lich kham cho benh nhan
            let message = `Bác sĩ ${appointment.schedule.doctor.user.firsname} ${appointment.schedule.doctor.user.lastname} đã chấp nhận lịch khám ngày ${appointment.date.toLocaleString('en-US', { timeZone: "Asia/Jakarta" })}`
            notificationService.CreateNotification(appointment.id, appointment.patient.user.id, message);
            notificationService.deleteNotificationOfUserLastWeek(appointment.patient.user.id)
            let dataSend = {};
            dataSend.message = message;
            dataSend.receiverEmail = appointment.patient.user.email;
            emailService.sendNotification(dataSend);
            let notificationAcceptPatient =
            {
                usersId: [appointment.patient.user.id],
                message: message
            }
            // Gui thong bao cuoc hen bi tu choi cho benh nhan
            let appointments = await db.Appointment.findAll({
                include: [
                    {
                        model: db.Patient,
                        required: true,
                        as: 'patient',
                        include:
                        {
                            model: db.User,
                            required: true,
                            as: 'user',
                            attributes: {
                                exclude: ['password', 'token']
                            },
                        },
                    },],
                where: {
                    status_id: statusNew,
                    schedule_id: appointment.schedule_id
                }
            })
            let notificationBeDeclined = {};
            if (appointments.length !== 0) {
                let userBeDeclined = [];
                let message2 = `Bác sĩ ${appointment.schedule.doctor.user.firsname} ${appointment.schedule.doctor.user.lastname} từ chối lịch khám ngày ${appointment.date.toLocaleString('en-US', { timeZone: "Asia/Jakarta" })}`
                appointments.map(a => {
                    userBeDeclined.push(a.patient.user.id);
                    notificationService.CreateNotification(appointment.id, a.patient.user.id, message2);
                    notificationService.deleteNotificationOfUserLastWeek(a.patient.user.id);
                });
                notificationBeDeclined.usersId = userBeDeclined;
                notificationBeDeclined.message = message2;


            }
            // chuyen status cac appointments sang cancel
            let [statusCancel, created] = await db.Status.findOrCreate({
                where: { name: "CANCEL" }, raw: true
            });
            await db.Appointment.update(
                {
                    status_id: statusCancel.id,
                },
                {
                    where: {
                        status_id: statusNew,
                        schedule_id: appointment.schedule_id
                    }
                }
            )
            resData.errCode = 0;
            resData.message = [
                notificationAcceptPatient
            ];
            console.log(notificationBeDeclined);
            if (!(Object.keys(notificationBeDeclined).length === 0)) resData.message.push(notificationBeDeclined);
            resolve(resData);
        } catch (err) {
            reject(err);
        }
    });
}
// get Appointment For User By User Id
let getAppointmentForUserByUserId = (id, key, page, limit, status, day, date_string, rate) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Xoa cac cuoc hen bi tre va xu ly chuyen trang thai cac cuoc hen sang done
            await DeleteAppointmentStatusNew();
            await ChangeStatusAppointmentToDone();
            ////////////////////////////////
            id = id - 0;
            page = page - 0;
            limit = limit - 0;
            rate = rate - 0;
            let offset = page * limit;
            let requirement = {};
            if (status !== '') {
                requirement = { name: status };
            }
            let requirementDate = {};
            if (day) {
                day = day - 0;
                let dateBegin = new Date();
                let dateEnd = new Date();
                console.log(day);
                dateEnd.setDate(dateEnd.getDate() + day);
                requirementDate = {
                    begin: { [Op.between]: [dateBegin, dateEnd] }
                };
            }
            let requirementDate2 = {};
            if (date_string !== '') {
                let dateStart = new Date(date_string);
                let dateEnd = new Date(date_string);
                dateEnd.setDate(dateStart.getDate() + 1);
                // Chuyen sang mui gio +7
                dateStart.setHours(dateStart.getHours() - 7);
                dateEnd.setHours(dateEnd.getHours() - 7);

                console.log(dateStart, dateEnd);
                requirementDate2 = {
                    date: {
                        [Op.between]: [dateStart, dateEnd]
                    }
                }
            }
            let requirementRate = {};
            if (Number.isInteger(rate) && (rate >= 1) && (rate <= 5)) {
                requirementRate = {
                    rating: rate
                };
            }
            const { count, rows } = await db.Appointment.findAndCountAll({
                include: [
                    {
                        model: db.Patient,
                        required: true,
                        as: 'patient',
                        include:
                        {
                            model: db.User,
                            required: true,
                            as: 'user',
                            attributes: {
                                exclude: ['password', 'token']
                            },
                        },
                    },

                    {
                        model: db.Schedule,
                        required: true,
                        as: 'schedule',
                        include:
                        {
                            model: db.Doctor,
                            required: true,
                            as: 'doctor',
                            include:
                            {
                                model: db.User,
                                required: true,
                                as: 'user',
                                attributes: {
                                    exclude: ['password', 'token']
                                },
                            }
                        },
                        where: requirementDate,
                    },
                    {
                        model: db.Status,
                        required: true,
                        as: 'status',
                        where: requirement
                    }
                ],
                where: {
                    [Op.and]: [
                        {
                            [Op.or]: [
                                { PatientId: db.sequelize.where(db.sequelize.col('patient.user.id'), '=', id) },
                                { DoctorId: db.sequelize.where(db.sequelize.col('schedule.doctor.user.id'), '=', id) }
                            ],
                        },
                        {
                            [Op.or]: [
                                { Patientname: db.sequelize.where(db.sequelize.fn('concat', db.sequelize.col('patient.user.firsname'), " ", db.sequelize.col('patient.user.lastname')), 'LIKE', '%' + key + '%') },
                                { Doctorname: db.sequelize.where(db.sequelize.fn('concat', db.sequelize.col('schedule.doctor.user.firsname'), " ", db.sequelize.col('schedule.doctor.user.lastname')), 'LIKE', '%' + key + '%') },
                            ]
                        },
                        requirementDate2,
                        requirementRate
                    ]
                },
                order: [
                    ['date', 'DESC']
                ],
                offset: offset,
                limit: limit,
                raw: true,
                nest: true,
            });
            let resData = {};
            resData.appointment = rows;
            resData.limit = limit;
            resData.totalPages = Math.ceil(count / limit);
            resData.totalElements = count
            resData.page = page;
            resolve(resData);
        } catch (err) {
            reject(err);
        }
    })
}
// Change Status Appointment To Done
let ChangeStatusAppointmentToDone = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let [statusDone, created] = await db.Status.findOrCreate({
                where: { name: "DONE" }, raw: true
            });
            let [statusConfirmed, created2] = await db.Status.findOrCreate({
                where: { name: "CONFIRMED" }, raw: true
            });

            let datenow = new Date();
            await db.Appointment.update(
                {
                    status_id: statusDone.id
                },
                {
                    where: {
                        date: { [Op.lte]: datenow },
                        status_id: statusConfirmed.id
                    }
                }
            );
            resolve(true);
        } catch (e) {
            reject(e);
        }
    });
}
// Delete Appointment Status New
let DeleteAppointmentStatusNew = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let [statusNew, created] = await db.Status.findOrCreate({
                where: { name: "NEW" }, raw: true
            });
            let datenow = new Date();
            let appointments = await db.Appointment.findAll({
                include: [
                    {
                        model: db.Patient,
                        required: true,
                        as: 'patient',
                        include:
                        {
                            model: db.User,
                            required: true,
                            as: 'user',
                            attributes: {
                                exclude: ['password', 'token']
                            },
                        },
                    },],
                where: {
                    date: { [Op.lte]: datenow },
                    status_id: statusNew.id
                },
                raw: true,
                nest: true
            })
            if (appointments.length !== 0) {
                console.log(appointments);
                let appointment = appointments[0];
                console.log(appointment);
                let message2 = `Bác sĩ đã từ chối lịch khám ngày ${appointment.date.toLocaleString('en-US', { timeZone: "Asia/Jakarta" })}`;
                appointments.map(a => {
                    notificationService.CreateNotification(appointment.id, a.patient.user.id, message2);
                    notificationService.deleteNotificationOfUserLastWeek(a.patient.user.id);

                });
            }
            await db.Appointment.destroy({
                where: {
                    date: { [Op.lte]: datenow },
                    status_id: statusNew.id
                }
            }
            );
            resolve(true);
        } catch (e) {
            reject(e);
        }
    });
}
// CanCel Appointment
let CanCelAppointment = (id, userId) => {
    return new Promise(async (resolve, reject) => {
        let resData = {};
        try {
            let [statusCanCel, created] = await db.Status.findOrCreate({
                where: { name: "CANCEL" }, raw: true
            });
            let appointment = await db.Appointment.findByPk(id, {
                include: [
                    {
                        model: db.Patient,
                        required: true,
                        as: 'patient',
                        include:
                        {
                            model: db.User,
                            required: true,
                            as: 'user',
                            attributes: {
                                exclude: ['password', 'token']
                            },
                        },
                    },
                    {
                        model: db.Status,
                        required: true,
                        as: 'status'
                    }
                ],
            });
            if (!appointment) {
                resData.errCode = 1;
                resData.message = "Cuộc hẹn không tồn tại";
                resolve(resData);
                return;
            }
            if (appointment.patient.user.id !== userId) {
                resData.errCode = 3;
                resData.message = "Không có quyền hủy cuộc hẹn";
                resolve(resData);
                return;
            }
            if (appointment.status.name !== "NEW") {
                resData.errCode = 2;
                resData.message = "Chỉ có thể hủy cuộc hẹn khi trạng thái cuộc hẹn là NEW";
                resolve(resData);
                return;
            }
            appointment.status_id = statusCanCel.id;
            await appointment.save();
            resData.errCode = 0;
            resData.message = "OK";
            resolve(resData);
        } catch (err) {
            reject(err);
        }
    });
}
// delete Appointment
let deleteAppointment = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            let resData = {};
            let appointment = await db.Appointment.findByPk(id);
            if (!appointment) {
                resData.errCode = 1;
                resData.message = 'Cuộc hẹn không tồn tại';
                resolve(resData);
                return;
            }
            await appointment.destroy();
            resData.errCode = 0;
            resData.message = 'OK';
            resolve(resData);
        } catch (err) {
            reject(err);
        }
    })
}
// Report Appointment
let ReportAppointment = (id, user_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            let resData = {};
            let appointment = await db.Appointment.findByPk(id, {
                include: [
                    {
                        model: db.Status,
                        required: true,
                        as: 'status'
                    },
                    {
                        model: db.Patient,
                        required: true,
                        as: 'patient',
                        include:
                        {
                            model: db.User,
                            required: true,
                            as: 'user',
                            attributes: {
                                exclude: ['password', 'token']
                            },
                        },
                    },

                    {
                        model: db.Schedule,
                        required: true,
                        as: 'schedule',
                        include:
                        {
                            model: db.Doctor,
                            required: true,
                            as: 'doctor',
                            include:
                            {
                                model: db.User,
                                required: true,
                                as: 'user',
                                attributes: {
                                    exclude: ['password', 'token']
                                },
                                where: { id: user_id }
                            }
                        }
                    },]
            });
            if (!appointment) {
                resData.errCode = 1;
                resData.message = 'Cuộc hẹn không tồn tại';
                resolve(resData);
                return;
            }
            if (appointment.status.name !== "DONE") {
                resData.errCode = 2;
                resData.message = 'Không thể báo cáo cuộc hẹn khi trạng thái cuộc hẹn khác DONE';
                resolve(resData);
                return;
            }

            let [status, created] = await db.Status.findOrCreate({
                where: { name: "REPORT" }, raw: true
            });
            appointment.status_id = status.id;
            await appointment.save();
            // Gui thong bao lich kham bi bao cao cho benh nhan va bac si
            // Thong bao cho benh nhan
            let message = `Bạn đã báo bị báo cáo không đến khám theo lịch ngày ${appointment.date.toLocaleString('en-US', { timeZone: "Asia/Jakarta" })}, admin đang tiến hành xác thực`;
            notificationService.CreateNotification(appointment.id, appointment.patient.user.id, message);
            notificationService.deleteNotificationOfUserLastWeek(appointment.patient.user.id);
            // Thong bao cho bac si
            let message2 = `Bạn đã báo cáo thành công bệnh nhân ${appointment.patient.user.firsname} ${appointment.patient.user.lastname} không đến khám ngày ${appointment.date.toLocaleString('en-US', { timeZone: "Asia/Jakarta" })}, admin đang tiến hành xử lý`;
            notificationService.CreateNotification(appointment.id, appointment.schedule.doctor.user.id, message2);
            notificationService.deleteNotificationOfUserLastWeek(appointment.schedule.doctor.user.id);

            resData.errCode = 0;
            resData.message = [
                {
                    usersId: [appointment.patient.user.id],
                    message: message
                },
                {
                    usersId: [appointment.schedule.doctor.user.id],
                    message: message2
                }
            ];

            resolve(resData);
        } catch (e) {
            reject(e);
        }
    });
}
// Admin Handles Appointment
let AdminHandlesAppointment = (id, violator) => {
    return new Promise(async (resolve, reject) => {
        try {
            let resData = {};
            let appointment = await db.Appointment.findByPk(id, {
                include: [
                    {
                        model: db.Patient,
                        required: true,
                        as: 'patient',
                        include:
                        {
                            model: db.User,
                            required: true,
                            as: 'user',
                            attributes: {
                                exclude: ['password', 'token']
                            },
                        },
                    },

                    {
                        model: db.Schedule,
                        required: true,
                        as: 'schedule',
                        include:
                        {
                            model: db.Doctor,
                            required: true,
                            as: 'doctor',
                            include:
                            {
                                model: db.User,
                                required: true,
                                as: 'user',
                                attributes: {
                                    exclude: ['password', 'token']
                                },
                            }
                        },
                    },
                    {
                        model: db.Status,
                        required: true,
                        as: 'status',
                        where: { name: "REPORT" }
                    }
                ]
            });
            if (!appointment) {
                resData.errCode = 1;
                resData.message = 'Cuộc hẹn không tồn tại';
                resolve(resData);
                return;
            }

            let [statusDONE, created] = await db.Status.findOrCreate({
                where: { name: "DONE" }, raw: true
            });
            let [statusVIOLATE, created2] = await db.Status.findOrCreate({
                where: { name: "PATIENT VIOLATE" }, raw: true
            });
            if (violator == 'patient') {
                appointment.status_id = statusVIOLATE.id;
                let message = `Bạn đã không đến khám theo đúng lịch khám ngày ${appointment.date.toLocaleString('en-US', { timeZone: "Asia/Jakarta" })}`;
                let numberOfViolate = await violationService.HandleViolation(appointment.patient.user.id, message);
                messageForPatient = `Bạn đã không đến khám theo đúng lịch khám ngày ${appointment.date.toLocaleString('en-US', { timeZone: "Asia/Jakarta" })}, số lần vi phạm của bạn đã tăng lên ${numberOfViolate}, quá 2 lần sẽ bị khóa tài khoản`;
                messageForDoctor = `Báo cáo bệnh nhân không đến khám ngày ${appointment.date.toLocaleString('en-US', { timeZone: "Asia/Jakarta" })} đã được admin xác nhận chính xác, tài khoản bệnh nhân ${appointment.patient.user.firsname} ${appointment.patient.user.lastname} đã bị cảnh cáo vi phạm`;
            }
            else {
                appointment.status_id = statusDONE.id;
                let message = `Báo cáo bệnh nhân ${appointment.patient.user.firsname} ${appointment.patient.user.lastname} không đến khám của bạn ngày ${appointment.date.toLocaleString('en-US', { timeZone: "Asia/Jakarta" })} là không đúng`;
                let numberOfViolate = await violationService.HandleViolation(appointment.schedule.doctor.user.id, message);
                messageForDoctor = `Báo cáo bệnh nhân ${appointment.patient.user.firsname} ${appointment.patient.user.lastname} không đến khám của bạn ngày ${appointment.date.toLocaleString('en-US', { timeZone: "Asia/Jakarta" })} là không đúng, số lần vi phạm của bạn đã tăng lên ${numberOfViolate}, quá 2 lần sẽ bị khóa tài khoản`;
                messageForPatient = `Bạn đã đến khám theo đúng lịch khám ngày ${appointment.date.toLocaleString('en-US', { timeZone: "Asia/Jakarta" })}, bác sĩ ${appointment.schedule.doctor.user.firsname} ${appointment.schedule.doctor.user.lastname} đã bị cảnh cáo vi phạm`;
            }

            await appointment.save();
            // Gui thong bao ket qua xu ly lich kham bi bao cao cho benh nhan va bac si
            // Thong bao cho benh nhan
            notificationService.CreateNotification(appointment.id, appointment.patient.user.id, messageForPatient);
            notificationService.deleteNotificationOfUserLastWeek(appointment.patient.user.id);
            // Thong bao cho bac si
            notificationService.CreateNotification(appointment.id, appointment.schedule.doctor.user.id, messageForDoctor);
            notificationService.deleteNotificationOfUserLastWeek(appointment.schedule.doctor.user.id);
            resData.errCode = 0;
            resData.errCode = 0;
            resData.message = [
                {
                    usersId: [appointment.patient.user.id],
                    message: messageForPatient
                },
                {
                    usersId: [appointment.schedule.doctor.user.id],
                    message: messageForDoctor
                }
            ]
            resolve(resData);
        } catch (e) {
            reject(e);
        }
    });
}
// Patient Rating Appointment
let PatientRatingAppointment = (userIdPatient, appointmentId, scores) => {
    return new Promise(async (resolve, reject) => {
        try {
            let resData = {};
            let appointment = await db.Appointment.findByPk(appointmentId, {
                include: [
                    {
                        model: db.Patient,
                        required: true,
                        as: 'patient',
                        include:
                        {
                            model: db.User,
                            required: true,
                            as: 'user',
                            attributes: {
                                exclude: ['password', 'token']
                            },
                            where: { id: userIdPatient }
                        },
                    },

                    {
                        model: db.Schedule,
                        required: true,
                        as: 'schedule',
                        include:
                        {
                            model: db.Doctor,
                            required: true,
                            as: 'doctor',
                            include:
                            {
                                model: db.User,
                                required: true,
                                as: 'user',
                                attributes: {
                                    exclude: ['password', 'token']
                                },
                            }
                        },
                    },
                    {
                        model: db.Status,
                        required: true,
                        as: 'status',
                        where: { name: "DONE" }
                    }
                ]
            })
            if (!appointment) {
                resData.errCode = 1;
                resData.message = 'Cuộc hẹn không tồn tại';
                resolve(resData);
                return;
            }
            let ratingOld = appointment.rating;
            doctorService.RatingDoctor(appointment.schedule.doctor.id, scores, ratingOld)
            appointment.rating = scores;
            await appointment.save();
            resData.errCode = 0;
            resData.message = 'OK';
            resolve(resData);
        } catch (e) {
            reject(e);
        }
    })
}
let updatePaymentIdAppointment = async (doctor_id, paymentId, datePayment) => {
    try {
        let appointments = await db.Appointment.findAll({
            include: [
                {
                    model: db.Schedule,
                    required: true,
                    as: 'schedule',
                    where: { doctor_id: doctor_id }
                },
                {
                    model: db.Status,
                    required: true,
                    as: 'status',
                    where: { name: "DONE" }
                }
            ],
            where: {
                paymentId: null,
                date: { [Op.lte]: datePayment }
            }

        })

        if (appointments.length !== 0) {
            // console.log(appointments);
            console.log('length',appointments.length);
            appointments.map(a => {a.paymentId = paymentId; a.save()});
        }

    } catch (e) {
        console.log(e);
    }
}
module.exports = {
    createAppointment: createAppointment,
    getAllAppointments: getAllAppointments,
    getAppointmentById: getAppointmentById,
    acceptAppointment: acceptAppointment,
    getAppointmentForUserByUserId: getAppointmentForUserByUserId,
    ChangeStatusAppointmentToDone: ChangeStatusAppointmentToDone,
    CanCelAppointment: CanCelAppointment,
    deleteAppointment: deleteAppointment,
    ReportAppointment: ReportAppointment,
    AdminHandlesAppointment: AdminHandlesAppointment,
    PatientRatingAppointment,
    updatePaymentIdAppointment
}