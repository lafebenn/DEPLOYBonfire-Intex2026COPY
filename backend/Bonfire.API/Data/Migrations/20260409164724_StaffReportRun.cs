using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bonfire.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class StaffReportRun : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "StaffReportRuns",
                columns: table => new
                {
                    StaffReportRunId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TemplateTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ReportingPeriodStart = table.Column<DateOnly>(type: "date", nullable: false),
                    ReportingPeriodEnd = table.Column<DateOnly>(type: "date", nullable: false),
                    SafehouseId = table.Column<int>(type: "int", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ParametersJson = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffReportRuns", x => x.StaffReportRunId);
                    table.ForeignKey(
                        name: "FK_StaffReportRuns_Safehouses_SafehouseId",
                        column: x => x.SafehouseId,
                        principalTable: "Safehouses",
                        principalColumn: "SafehouseId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StaffReportRuns_SafehouseId",
                table: "StaffReportRuns",
                column: "SafehouseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StaffReportRuns");
        }
    }
}
