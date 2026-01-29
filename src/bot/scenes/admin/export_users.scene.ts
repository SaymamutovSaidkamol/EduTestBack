import { Wizard, WizardStep, Ctx } from 'nestjs-telegraf';
import { Scenes, Markup } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';
import * as ExcelJS from 'exceljs';

@Wizard('admin-export-users')
export class AdminExportUsersScene {
    constructor(private readonly prisma: PrismaService) { }

    @WizardStep(1)
    async onEnter(@Ctx() ctx: Scenes.WizardContext) {
        try {
            await ctx.reply("Foydalanuvchilar ro'yxati Excel formatida tayyorlanmoqda...");

            const users = await this.prisma.user.findMany();

            if (users.length === 0) {
                await ctx.reply("Foydalanuvchilar topilmadi.");
                return ctx.scene.leave();
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Users');

            worksheet.columns = [
                { header: 'ID', key: 'id', width: 36 },
                { header: 'Ism', key: 'firstName', width: 20 },
                { header: 'Familya', key: 'lastName', width: 20 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Phone', key: 'phone', width: 20 },
                { header: 'Role', key: 'role', width: 15 },
                { header: 'Active', key: 'isActive', width: 10 },
                { header: 'Created At', key: 'createdAt', width: 25 },
            ];

            users.forEach(user => {
                worksheet.addRow({
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone || 'N/A',
                    role: user.role,
                    isActive: user.isActive ? 'Yes' : 'No',
                    createdAt: user.createdAt.toISOString(),
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();

            await ctx.replyWithDocument({
                source: Buffer.from(buffer),
                filename: `users_export_${new Date().toISOString().split('T')[0]}.xlsx`
            }, {
                caption: "Barcha foydalanuvchilar ro'yxati (Excel)"
            });

        } catch (error) {
            console.error('Export Excel error:', error);
            await ctx.reply("Excel faylni yaratishda xatolik yuz berdi.");
        }
        return ctx.scene.leave();
    }
}
