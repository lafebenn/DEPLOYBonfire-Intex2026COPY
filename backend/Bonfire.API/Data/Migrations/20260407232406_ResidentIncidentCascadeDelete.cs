using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bonfire.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class ResidentIncidentCascadeDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_IncidentReports_Residents_ResidentId",
                table: "IncidentReports");

            migrationBuilder.AddForeignKey(
                name: "FK_IncidentReports_Residents_ResidentId",
                table: "IncidentReports",
                column: "ResidentId",
                principalTable: "Residents",
                principalColumn: "ResidentId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_IncidentReports_Residents_ResidentId",
                table: "IncidentReports");

            migrationBuilder.AddForeignKey(
                name: "FK_IncidentReports_Residents_ResidentId",
                table: "IncidentReports",
                column: "ResidentId",
                principalTable: "Residents",
                principalColumn: "ResidentId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
